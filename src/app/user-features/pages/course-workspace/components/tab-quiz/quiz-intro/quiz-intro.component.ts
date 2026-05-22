import {
  Component, OnInit, inject, DestroyRef,
  Output, EventEmitter, signal, computed, HostListener
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IQuizCourse, IQuizStatistics } from '../../../../../models/courseWorkspace.model';
import { CourseWorkspaceService } from '../../../../../services/course-workspace';
import { NgClass } from '@angular/common';

type FilterTab = 'all' | 'completed' | 'not_started';

@Component({
  selector: 'app-quiz-intro',
  imports: [NgClass],
  templateUrl: './quiz-intro.component.html',
  styleUrls: ['./quiz-intro.component.css']
})
export class QuizIntro implements OnInit {

  @Output() startQuiz = new EventEmitter<IQuizCourse>();

  private route = inject(ActivatedRoute);
  private courseWorkspaceService = inject(CourseWorkspaceService);
  private destroyRef = inject(DestroyRef);

  quizzes = signal<IQuizCourse[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);

  activeTab = signal<FilterTab>('all');
  courseName = signal('');
  statistics = signal<IQuizStatistics | null>(null);

  currentPage = signal(1);
  pageSize = 10;
  hasMore = signal(true);
  private courseSlug = '';

  filteredQuizzes = computed(() => {
    const all = this.quizzes();
    const tab = this.activeTab();

    if (tab === 'completed')
      return all.filter(q => q.quiz_status === 'completed' || q.quiz_status === 'passed');

    if (tab === 'not_started')
      return all.filter(q => q.quiz_status === 'not_started');

    return all;
  });

  ngOnInit() {
    this.courseSlug = this.route.parent?.snapshot.paramMap.get('slug') ?? '';
    this.loadPage(1);
  }

  private loadPage(page: number) {
    const isFirst = page === 1;

    if (isFirst) {
      this.isLoading.set(true);
    } else {
      if (this.isLoadingMore()) return;
      this.isLoadingMore.set(true);
    }

    this.courseWorkspaceService.getQuizzes(this.courseSlug, page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const newQuizzes = res.data.quizzes || [];

          if (isFirst) {
            this.quizzes.set(newQuizzes);
          } else {
            this.quizzes.update(old => {
              const combined = [...old, ...newQuizzes];
              return combined.filter(
                (q, i, self) => i === self.findIndex(x => x.slug === q.slug)
              );
            });
          }

          this.statistics.set(res.data.statistics);
          this.hasMore.set(page < res.data.total_pages);
          this.currentPage.set(page);

          if (!this.courseName() && newQuizzes.length) {
            this.courseName.set(newQuizzes[0].course_name);
          }

          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        }
      });
  }

  loadMore() {
    if (!this.hasMore() || this.isLoadingMore()) return;
    this.loadPage(this.currentPage() + 1);
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.isLoadingMore() || !this.hasMore()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 300;

    if (scrollPosition >= threshold) {
      this.loadMore();
    }
  }

  setTab(tab: FilterTab) {
    this.activeTab.set(tab);
  }

  goToQuiz(quiz: IQuizCourse) {
    this.startQuiz.emit(quiz);
  }
}
