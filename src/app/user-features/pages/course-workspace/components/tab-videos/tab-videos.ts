import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IVideoCompleteResponse, Video } from '../../../../models/courseWorkspace.model';
import { CourseWorkspaceService } from '../../../../services/course-workspace';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

declare var YT: any;

@Component({
  selector: 'app-tab-videos',
  imports: [CommonModule],
  templateUrl: './tab-videos.html',
  styleUrl: './tab-videos.css',
})
export class TabVideos implements OnInit, OnDestroy {
  @Input() courseSlug!: string;

  videos = signal<Video[]>([]);
  selectedVideo = signal<Video | null>(null);
  isLoading = signal(true);
  error = signal(false);

  watchProgress = signal<Record<string, number>>({});
  realDurations = signal<Record<string, number>>({});
  videoErrors = signal<Record<string, string | null>>({});

  private ytPlayer: any = null;
  private completing = new Set<string>();

  constructor(
    private sanitizer: DomSanitizer,
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

        const first = sorted[0];
        if (first && this.getType(first) === 'youtube') {
          setTimeout(() => this.initYouTubePlayer(first), 300);
        }
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy() {
    if (this.ytPlayer) {
      try { this.ytPlayer.destroy(); } catch { }
    }
    this.ytPlayer = null;
  }

  // ── Select Video ────────────────────────────────────────────────────────────

  select(video: Video) {
    this.selectedVideo.set(video);
    this.videoErrors.update(e => ({ ...e, [video.slug]: null }));

    if (this.getType(video) === 'youtube') {
      setTimeout(() => this.initYouTubePlayer(video), 300);
    }
  }

  // ── Video Type ──────────────────────────────────────────────────────────────

  getType(video: Video): 'youtube' | 'upload' | 'none' {
    if (video.video_url?.trim()) return 'youtube';
    if (video.video_upload) return 'upload';
    return 'none';
  }

  // ── Duration Helpers ────────────────────────────────────────────────────────

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

  // ── Progress ────────────────────────────────────────────────────────────────

  getProgress(video: Video): number {
    const watched = this.watchProgress()[video.slug] ?? 0;
    const total = this.realDurations()[video.slug] || this.toSeconds(video.duration);
    if (!total) return 0;
    return Math.min(Math.round((watched / total) * 100), 100);
  }

  // ── Uploaded Video Events ───────────────────────────────────────────────────

  onTimeUpdate(event: Event, slug: string) {
    const el = event.target as HTMLVideoElement;
    this.watchProgress.update(p => ({ ...p, [slug]: el.currentTime }));

    if (el.duration && el.duration > 0) {
      if (this.realDurations()[slug] !== el.duration) {
        this.realDurations.update(d => ({ ...d, [slug]: el.duration }));
      }
    }

    const video = this.videos().find(v => v.slug === slug);
    if (video && !video.is_completed && el.duration > 0 && el.currentTime > el.duration - 1) {
      this.markComplete(video, Math.floor(el.currentTime));
    }
  }

  onVideoEnded(event: Event, video: Video) {
    const el = event.target as HTMLVideoElement;
    this.markComplete(video, Math.floor(el.currentTime));
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

  // ── Mark Complete ───────────────────────────────────────────────────────────
  markComplete(video: Video, currentTime: number = 9999999) {
    if (video.is_completed) return;
    if (this.completing.has(video.slug)) return;
    this.completing.add(video.slug);

    this.workspaceService.markVideoComplete(video.slug, currentTime).subscribe({
      next: (res: IVideoCompleteResponse) => {
        if (res?.data?.is_completed) {
          this.videos.update(vs => vs.map(v =>
            v.slug === video.slug ? { ...v, is_completed: true } : v
          ));
          if (this.selectedVideo()?.slug === video.slug) {
            this.selectedVideo.update(v => v ? { ...v, is_completed: true } : null);
          }
        }
        this.completing.delete(video.slug);
      },
      error: () => {
        this.completing.delete(video.slug);
      }
    });
  }

  // ── YouTube IFrame Player API ───────────────────────────────────────────────

  extractYoutubeId(url: string | null): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1];
      return u.searchParams.get('v') ?? '';
    } catch {
      return '';
    }
  }

  initYouTubePlayer(video: Video) {
    const videoId = this.extractYoutubeId(video.video_url);
    if (!videoId) return;

    if (this.ytPlayer) {
      try { this.ytPlayer.destroy(); } catch { }
      this.ytPlayer = null;
    }

    const createPlayer = () => {
      const container = document.getElementById('yt-player');
      if (!container) return;

      container.innerHTML = '';
      const playerTarget = document.createElement('div');
      container.appendChild(playerTarget);

      this.ytPlayer = new YT.Player(playerTarget, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === YT.PlayerState.ENDED) {
              const currentTime = Math.floor((this.ytPlayer?.getCurrentTime?.() ?? 9999999) + 100);
              this.markComplete(video, currentTime);
            }
          }
        }
      });
    };

    if (typeof YT !== 'undefined' && YT.Player) {
      createPlayer();
    } else {
      const prev = (window as any)['onYouTubeIframeAPIReady'];
      (window as any)['onYouTubeIframeAPIReady'] = () => {
        if (prev) prev();
        createPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }

  // Fallback — kept for reference
  getYoutubeEmbed(url: string | null): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const id = this.extractYoutubeId(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?rel=0`
    );
  }
}