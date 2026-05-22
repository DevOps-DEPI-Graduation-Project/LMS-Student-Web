import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Card } from '../../../../components/shared/card/card';
import { CourseService } from '../../../../user-features/services/user';
import { ICourseCardData, IPackageCardData } from '../../../../user-features/models/course.model';
import { ImgFallback } from '../../../../shared/directives/img-fallback';
import { Skeleton } from "../../../../components/shared/skeleton/skeleton";

@Component({
  selector: 'app-course-section',
  standalone: true,
  imports: [Card, RouterLink, CommonModule, ImgFallback, Skeleton],
  templateUrl: './course-section.html',
  styleUrl: './course-section.css',
})
export class CourseSection implements OnInit {
  private courseService = inject(CourseService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  // ── Packages ──
  learningTracks: IPackageCardData[] = [];
  isLoadingMoreTracks = false;
  private tracksPage = 1;
  private tracksPageSize = 4;
  tracksTotalPages = 1;

 get hasMoreTracks(): boolean {
  return this.tracksPage < this.tracksTotalPages;
}

  // ── Courses ──
  manyCourses:            ICourseCardData[] = [];
  isLoadingMoreCourses    = false;
  private coursesPage     = 1;
  private coursesPageSize = 8;
  coursesTotalPages       = 1;

get hasMoreCourses(): boolean {
  return this.coursesPage < this.coursesTotalPages;
}


  ngOnInit() {
    this.loadTracks();
    this.loadCourses();
  }

  // ── Packages ─────────────────────────────
  private loadTracks() {
    this.courseService.getPackagesPaged(this.tracksPage, this.tracksPageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ packages, totalPages }) => {
        this.learningTracks     = [...this.learningTracks, ...packages];
        this.tracksTotalPages   = totalPages;
        this.isLoadingMoreTracks = false;
      },
      error: () => this.isLoadingMoreTracks = false,
    });
  }

  loadMoreTracks() {
    if (!this.hasMoreTracks || this.isLoadingMoreTracks) return;
    this.tracksPage++;
    this.isLoadingMoreTracks = true;
    this.loadTracks();
  }

  // ── Courses ─────────────────────
  private loadCourses() {
    this.courseService.getAllCoursesPaged(this.coursesPage, this.coursesPageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ courses, totalPages }) => {
        this.manyCourses        = [...this.manyCourses, ...courses];
        this.coursesTotalPages  = totalPages;
        this.isLoadingMoreCourses = false;
      },
      error: () => this.isLoadingMoreCourses = false,
    });
  }
  onCourseClick(slug: string) {
  this.router.navigate(['/course', slug]);
}

  loadMoreCourses() {
    if (!this.hasMoreCourses || this.isLoadingMoreCourses) return;
    this.coursesPage++;
    this.isLoadingMoreCourses = true;
    this.loadCourses();
  }

}
