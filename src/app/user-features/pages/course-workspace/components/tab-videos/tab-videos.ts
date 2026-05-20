import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { IVideoCompleteResponse, Video } from '../../../../models/courseWorkspace.model';
import { CourseWorkspaceService } from '../../../../services/course-workspace'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tab-videos',
  imports: [CommonModule],
  templateUrl: './tab-videos.html',
  styleUrl: './tab-videos.css',
})
export class TabVideos implements OnInit {
  @Input() courseSlug!: string;

  videos = signal<Video[]>([]);
  selectedVideo = signal<Video | null>(null);
  isLoading = signal(true);
  error = signal(false);

  watchProgress = signal<Record<string, number>>({});
  videoErrors = signal<Record<string, string | null>>({});
  constructor(private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private workspaceService: CourseWorkspaceService,

  ) { }

  ngOnInit() {
    const slug = this.route.parent?.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set(true);
      this.isLoading.set(false);
      return;
    }

    this.workspaceService.getVideos(slug).subscribe({
      next: (res) => {
        const sorted = [...res.data].sort((a, b) => a.order - b.order);
        this.videos.set(sorted);
        this.selectedVideo.set(sorted[0] ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onVideoError(event: Event, slug: string) {
    const video = event.target as HTMLVideoElement;
    const err = video.error;

    const messages: Record<number, string> = {
      1: 'Playback was aborted.',
      2: 'A network error occurred while loading the video.',
      3: 'The video could not be decoded.',
      4: 'This video format is not supported or the source is unavailable.',
    };

    const msg = err ? (messages[err.code] ?? 'An unknown error occurred.') : 'An unknown error occurred.';
    this.videoErrors.update(e => ({ ...e, [slug]: msg }));
  }


  retryVideo(slug: string) {
    this.videoErrors.update(e => ({ ...e, [slug]: null }));
  }
  select(video: Video) {
    this.selectedVideo.set(video);
    this.videoErrors.update(e => ({ ...e, [video.slug]: null }));
  }

  getType(video: Video): 'youtube' | 'upload' | 'none' {
    if (video.video_url?.trim()) return 'youtube';
    if (video.video_upload) return 'upload';
    return 'none';
  }


  formatDuration(duration: string | null): string {
    if (!duration) return '—';
    const [h, m, s] = duration.split(':').map(Number);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  toSeconds(duration: string | null): number {
    if (!duration) return 0;
    const [h, m, s] = duration.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  }

  getProgress(video: Video): number {
    const watched = this.watchProgress()[video.slug] ?? 0;
    const total = this.toSeconds(video.duration);
    if (!total) return 0;
    return Math.min(Math.round((watched / total) * 100), 100);
  }

  onTimeUpdate(event: Event, slug: string) {
    const el = event.target as HTMLVideoElement;
    this.watchProgress.update(p => ({ ...p, [slug]: el.currentTime }));
  }

  onVideoEnded(event: Event, video: Video) {
    if (video.is_completed) return;

    const seconds = this.toSeconds(video.duration) + 10;

    this.workspaceService.completeVideo(video.slug, seconds).subscribe({
      next: (res: IVideoCompleteResponse) => {
        this.videos.update(list =>
          list.map(v => v.slug === video.slug ? { ...v, is_completed: true } : v)
        );
        if (this.selectedVideo()?.slug === video.slug) {
          this.selectedVideo.update(v => v ? { ...v, is_completed: true } : null);
        }
      },
      error: (err: IVideoCompleteResponse) => {
       console.log(err);
      }
    });
  }

  getYoutubeEmbed(url: string | null): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');

    let id = '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        id = u.pathname.slice(1);
      } else if (u.pathname.includes('/shorts/')) {
        id = u.pathname.split('/shorts/')[1];
      } else {
        id = u.searchParams.get('v') ?? '';
      }
    } catch { }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?rel=0`
    );
  }


}