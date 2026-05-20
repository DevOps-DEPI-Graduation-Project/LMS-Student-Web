import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Video } from '../../../../models/courseWorkspace.model';
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
  realDurations = signal<Record<string, number>>({});
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
    // Prioritize real duration captured during playback over model duration
    const total = this.realDurations()[video.slug] || this.toSeconds(video.duration);
    if (!total) return 0;
    return Math.min(Math.round((watched / total) * 100), 100);
  }

  onTimeUpdate(event: Event, slug: string) {
    const el = event.target as HTMLVideoElement;
    this.watchProgress.update(p => ({ ...p, [slug]: el.currentTime }));

    // Store the actual duration in case metadata was wrong
    if (el.duration && el.duration > 0) {
      if (this.realDurations()[slug] !== el.duration) {
        this.realDurations.update(d => ({ ...d, [slug]: el.duration }));
      }
    }

    // Auto-complete when reaching the end
    const video = this.videos().find(v => v.slug === slug);
    if (video && !video.is_completed && el.duration > 0 && el.currentTime > el.duration - 1) {
      this.markComplete(video);
    }
  }

  markComplete(video: Video) {
    if (video.is_completed) return;

    // Send total duration + 10 as requested by user
    const totalSeconds = this.toSeconds(video.duration) + 10;

    this.workspaceService.markVideoComplete(video.slug, totalSeconds).subscribe({
      next: () => {
        // Update local state
        this.videos.update(vs => vs.map(v =>
          v.slug === video.slug ? { ...v, is_completed: true } : v
        ));
      },
      error: (err: any) => console.error('Failed to mark video as complete:', err)
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