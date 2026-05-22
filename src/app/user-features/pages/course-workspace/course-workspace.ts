import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { WorkspaceHeader } from './components/workspace-header/workspace-header';
import { WorkspaceTabs } from './components/workspace-tabs/workspace-tabs';
import { CourseWorkspaceService } from '../../services/course-workspace';
import { ICourseWorkspaceHeader } from '../../models/courseWorkspace.model';
import { TabVideos } from "./components/tab-videos/tab-videos";

@Component({
  selector: 'app-course-workspace',
  standalone: true,
  imports: [CommonModule, RouterOutlet, WorkspaceHeader, WorkspaceTabs],
  templateUrl: './course-workspace.html',
  styleUrl: './course-workspace.css',
})
export class CourseWorkspace implements OnInit, OnDestroy {

  course: ICourseWorkspaceHeader | null = null;
  isLoading = true;

  private slug!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private courseWorkspaceService: CourseWorkspaceService
  ) { }

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.loadCourse();
  }

  private loadCourse() {
    this.isLoading = true;

    this.courseWorkspaceService
      .getCourseWorkspaceData(this.slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.course = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Something went wrong',
            text: 'Could not load course details. Please try again.',
            confirmButtonText: 'Retry',
          }).then(result => {
            if (result.isConfirmed) this.loadCourse();
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}