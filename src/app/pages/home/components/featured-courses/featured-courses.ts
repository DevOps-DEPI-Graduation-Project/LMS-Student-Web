import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { Card } from '../../../../components/shared/card/card';
import { CourseService } from '../../../../user-features/services/user';
import { ICourseCardData } from '../../../../user-features/models/course.model';
import { Skeleton } from '../../../../components/shared/skeleton/skeleton';

@Component({
  selector: 'app-featured-courses',
  standalone: true,
  imports: [Card, CommonModule, Skeleton],
  templateUrl: './featured-courses.html',
  styleUrl: './featured-courses.css',
})
export class FeaturedCourses implements OnInit {

  private courseService = inject(CourseService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  courses: ICourseCardData[] = [];

  isLoading = signal(true);

  ngOnInit() {
    this.courseService.getTopRatedCourses(8).pipe(
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.courses = data;
        this.isLoading.set(false);
      }
    })
  }
  onCourseClick(slug: string) {
    this.router.navigate(['/course', slug]);
  }

  onViewAllCourses() {
    this.router.navigate(['/explore']);
  }
}
