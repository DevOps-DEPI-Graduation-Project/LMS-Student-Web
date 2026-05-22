import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of, switchMap } from 'rxjs';
import { CourseService } from '../../user-features/services/user';
import { AuthService } from '../../auth/services/auth';
import { AlertService } from '../../shared/services/alert';
import { User } from '../../user-features/services/user';
import { ICourseDetailRequest, CourseRatingResponse } from '../../user-features/models/course.model';
import { ImgFallback } from '../../shared/directives/img-fallback';
import { Skeleton } from '../../components/shared/skeleton/skeleton';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ImgFallback, Skeleton],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css',
})
export class CourseDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private alert = inject(AlertService);
  private userService = inject(User);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  courseDetail: ICourseDetailRequest | null = null;
  isLoading = true;
  isEnrolling = signal(false);
  isEnrolled = signal(false);

  // ─── Rating Signals ───────────────────────────────────────────────────────
  selectedRating = signal<number>(0);
  hoveredRating = signal<number>(0);
  isSubmittingRating = signal<boolean>(false);
  ratingSubmitted = signal<boolean>(false);

  // ─── localStorage helpers ─────────────────────────────────────────────────
  private getRatingKey(slug: string): string {
    const userSlug = this.auth.currentUser()?.slug ?? 'guest';
    return `rating_${userSlug}_${slug}`;
  }
  private saveRatingLocally(slug: string, rate: number): void {
    localStorage.setItem(this.getRatingKey(slug), rate.toString());
  }

  private getSavedRating(slug: string): number {
    const saved = localStorage.getItem(this.getRatingKey(slug));
    return saved ? parseInt(saved, 10) : 0;
  }

  // ─── Load Course ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.loadCourseData(slug);
  }

  private loadCourseData(slug: string) {
    this.isLoading = true;
    this.courseService.getCourseDetails(slug).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.courseDetail = data;
        this.isLoading = false;
        this.userService.setSelectedCourse(data);
        this.isEnrolled.set(data.is_enrolled ?? false);

        if (data.is_enrolled && this.auth.isLoggedIn()) {
          const savedRating = this.getSavedRating(data.slug);
          if (savedRating > 0) {
            this.selectedRating.set(savedRating);
            this.ratingSubmitted.set(true);
          }
        }
      },
      error: () => this.isLoading = false,
    });
  }

  // ─── Enroll ───────────────────────────────────────────────────────────────
  goToWorkspace() {
    this.router.navigate(['/CourseWorkspace', this.courseDetail?.slug]);
  }

  onEnroll() {
    if (!this.auth.isLoggedIn()) {
      this.alert.requireLoginToEnroll(this.courseDetail?.slug ?? '');
      return;
    }

    if (this.isEnrolled()) {
      this.goToWorkspace();
      return;
    }

    if (!this.courseDetail || this.isEnrolling()) return;

    if (!this.courseDetail.is_active) {
      this.alert.enrollError('This course is not currently available. Please try again later.');
      return;
    }

    this.isEnrolling.set(true);

    const token$: Observable<unknown> = this.auth.getToken()
      ? of(null)
      : this.auth.refreshAccessToken();

    token$.pipe(
      switchMap(() => this.courseService.enrollInCourse(this.courseDetail!.slug)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isEnrolling.set(false);
        this.isEnrolled.set(true);
        localStorage.removeItem('pendingCourseSlug');
        this.userService.getMyEnrollments();

        Swal.fire({
          icon: 'success',
          title: 'Enrolled Successfully!',
          text: `You are now enrolled in ${this.courseDetail!.title}`,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.isEnrolling.set(false);
        const detail = err?.error?.detail || err?.error?.message || '';

        if (err.status === 401) {
          this.auth.logout();
          this.alert.requireLogin('Session expired. Please login again.');
          return;
        }

        if (err.status === 400 && detail.toLowerCase().includes('already')) {
          this.isEnrolled.set(true);
          this.goToWorkspace();
          return;
        }

        this.alert.enrollError(detail);
      },
    });
  }

  handleCourseAction() {
    if (!this.auth.isLoggedIn()) {
      this.alert.requireLoginToEnroll(this.courseDetail?.slug ?? '');
      return;
    }

    if (this.isEnrolled()) {
      this.router.navigate(['/CourseWorkspace', this.courseDetail?.slug]);
      return;
    }

    this.onEnroll();
  }

  exportCourseImage() {
    if (this.courseDetail?.image) {
      const filename = `${this.courseDetail.title.replace(/\s+/g, '-').toLowerCase()}-cover.jpg`;
      this.userService.downloadImage(this.courseDetail.image, filename);
    }
  }

  // ─── Rating ───────────────────────────────────────────────────────────────
  onHoverStar(star: number) { this.hoveredRating.set(star); }
  onLeaveStar() { this.hoveredRating.set(0); }
  onSelectStar(star: number) { this.selectedRating.set(star); }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[rating] ?? 'Select a star to leave your rating';
  }

  submitRating() {
    if (!this.selectedRating() || this.isSubmittingRating() || !this.courseDetail) return;

    this.isSubmittingRating.set(true);

    this.userService.rateCourse(this.courseDetail.slug, this.selectedRating()).subscribe({
      next: (res) => {
        if (res.success) {
          // ✅ احفظ في localStorage
          this.saveRatingLocally(this.courseDetail!.slug, res.data.rate);

          this.ratingSubmitted.set(true);
          this.selectedRating.set(res.data.rate);

          Swal.fire({
            icon: 'success',
            title: 'Rating Submitted!',
            text: `You rated this course ${res.data.rate} star${res.data.rate > 1 ? 's' : ''}`,
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }
        this.isSubmittingRating.set(false);
      },
      error: () => {
        this.isSubmittingRating.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'Something went wrong. Please try again.',
          confirmButtonText: 'Try Again',
        });
      },
    });
  }
}