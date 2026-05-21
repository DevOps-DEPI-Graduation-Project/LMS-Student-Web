import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CourseService } from '../../user-features/services/user';
import { AuthService } from '../../auth/services/auth';
import { ICourseCardData, EnrolledCourse } from '../../user-features/models/course.model';
import { Card } from '../../components/shared/card/card';
import { User } from '../../user-features/services/user';

import { CourseCard } from "../../user-features/shared/components/course-card/course-card";
import { Skeleton } from "../../components/shared/skeleton/skeleton";

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [Card, CommonModule, CourseCard, Skeleton],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {

  private userServices = inject(User);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private courseService = inject(CourseService);


  constructor(public router: Router) { }


  dashboardCourses: EnrolledCourse[] = [];
  topRatedCourses: ICourseCardData[] = [];
  latestCourse?: EnrolledCourse;
  ngOnInit() {
    this.auth.authReady$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadDashboardCourses();
      this.loadTopRated();
    });
  }

private loadDashboardCourses() {
  this.userServices.getMyEnrollments(1, 4).pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: (res) => {
      this.dashboardCourses = res.data.courses;
      this.latestCourse = res.data.courses[0];
    },
    error: () => this.dashboardCourses = []
  });
}
  private loadTopRated() {
    this.courseService.getTopRatedCourses(4).pipe(
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => this.topRatedCourses = data,
    });
  }

  onCourseClick(slug: string) {
    this.router.navigate(['/course', slug]);
  }
  goToMyCourses() {
    this.router.navigate(['/my-courses']);
  }
   goToExplore() {
    this.router.navigate(['/explore']);
  }
}
