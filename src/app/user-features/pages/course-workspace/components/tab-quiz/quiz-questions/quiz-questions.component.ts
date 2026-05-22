import { Component, OnInit, inject, DestroyRef, Input, Output, EventEmitter, signal, computed, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseWorkspaceService } from '../../../../../services/course-workspace';
import { IAnswerSubmit, IQuestion, ISubmitQuizData } from '../../../../../models/courseWorkspace.model';

@Component({
  selector: 'app-quiz-questions',
  templateUrl: './quiz-questions.component.html',
  styleUrls: ['./quiz-questions.component.css']
})
export class QuizQuestions implements OnInit {
  @Input() quizSlug = '';
  @Output() submitted = new EventEmitter<ISubmitQuizData>();
  @Output() back = new EventEmitter<void>();

  private workspaceService = inject(CourseWorkspaceService);
  private destroyRef = inject(DestroyRef);

  questions = signal<IQuestion[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  currentPage = signal(1);
  pageSize = 10;
  hasMore = signal(true);
  isLoadingMore = signal(false);

  answers = signal<Record<string, string[]>>({});

  validQuestions = computed(() =>
    this.questions().filter(q => q.choices?.length > 0)
  );

  isEmpty = computed(() =>
    !this.isLoading() &&
    this.validQuestions().length === 0
  );

  answeredCount = computed(() =>
    Object.keys(this.answers()).filter(k => this.answers()[k]?.length > 0).length
  );

  allAnswered = computed(() =>
    this.validQuestions().length > 0 &&
    this.answeredCount() === this.validQuestions().length
  );

  progress = computed(() =>
    this.validQuestions().length
      ? Math.round((this.answeredCount() / this.validQuestions().length) * 100)
      : 0
  );

  ngOnInit() {
    if (!this.quizSlug) {
      this.isLoading.set(false);
      return;
    }
    this.loadQuestions(1);
  }

  loadQuestions(page: number) {
    if (this.isLoadingMore()) return;

    this.isLoadingMore.set(true);

    this.workspaceService.getQuizQuestions(this.quizSlug, page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.questions.update(old => [...old, ...(res.data.quizzes || [])]);
          this.hasMore.set(page < res.data.total_pages);
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
    this.currentPage.set(this.currentPage() + 1);
    this.loadQuestions(this.currentPage());
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.isLoadingMore() || !this.hasMore()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 600;

    if (scrollPosition >= threshold) {
      this.loadMore();
    }
  }

  selectChoice(questionSlug: string, choiceSlug: string, type: 'single' | 'multiple') {
    const current = { ...this.answers() };
    if (type === 'single') {
      current[questionSlug] = current[questionSlug]?.[0] === choiceSlug ? [] : [choiceSlug];
    } else {
      const selected = current[questionSlug] ?? [];
      current[questionSlug] = selected.includes(choiceSlug)
        ? selected.filter(s => s !== choiceSlug)
        : [...selected, choiceSlug];
    }
    this.answers.set(current);
  }

  isSelected(questionSlug: string, choiceSlug: string): boolean {
    return this.answers()[questionSlug]?.includes(choiceSlug) ?? false;
  }

  isQuestionAnswered(questionSlug: string): boolean {
    return (this.answers()[questionSlug]?.length ?? 0) > 0;
  }

  onSubmit() {
    if (!this.allAnswered()) {
      const first = this.validQuestions().find(q => !this.isQuestionAnswered(q.slug));

      if (first) {
        const el = document.getElementById(first.slug);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    if (this.isSubmitting()) return;

    const ans = this.answers();
    const answers: IAnswerSubmit[] = Object.keys(ans).map(questionSlug => ({
      question_slug: questionSlug,
      choice_slugs: ans[questionSlug]
    }));

    this.isSubmitting.set(true);

    this.workspaceService.submitQuiz(this.quizSlug, { answers })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.submitted.emit(res.data);
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  goBack() {
    this.back.emit();
  }
}
