import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../services/user';
import { EnrolledCourse } from '../../models/course.model'; 
import { CourseCard } from '../../shared/components/course-card/course-card';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Skeleton } from '../../../components/shared/skeleton/skeleton';

@Component({
  selector: 'app-my-courses',
  imports: [CourseCard, CommonModule, Skeleton],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.css',
})
export class MyCourses implements OnInit {

  private userServices = inject(User);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  courses: EnrolledCourse[] = [];
  isLoading = true;
  isLoadingMore = false;
  error: string | null = null;

  currentPage = 1;
  totalPages = 1;
  pageSize = 12;

  get hasMore(): boolean {
    return this.currentPage < this.totalPages;
  }

  get inProgressCount(): number {
    return this.courses.filter(c => c.status === 'in_progress').length;
  }

  get completedCount(): number {
    return this.courses.filter(c => c.status === 'completed').length;
  }

  ngOnInit(): void {
    this.loadPage(1);
  }

  private loadPage(page: number): void {
    const isFirst = page === 1;

    if (isFirst) {
      this.isLoading = true;
    } else {
      if (this.isLoadingMore) return;
      this.isLoadingMore = true;
    }

    this.userServices.getMyEnrollments(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const newCourses = res.data.courses || [];

          if (isFirst) {
            this.courses = newCourses;
          } else {
            const combined = [...this.courses, ...newCourses];
            this.courses = combined.filter(
              (c, i, self) => i === self.findIndex(x => x.slug === c.slug)
            );
          }

          this.totalPages = res.data.total_pages;
          this.currentPage = page;
          this.isLoading = false;
          this.isLoadingMore = false;
        },
        error: () => {
          this.error = 'Failed to load courses';
          this.isLoading = false;
          this.isLoadingMore = false;
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore || this.isLoadingMore) return;
    this.loadPage(this.currentPage + 1);
  }
}
