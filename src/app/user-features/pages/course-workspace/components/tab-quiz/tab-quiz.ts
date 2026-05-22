import { Component, signal } from '@angular/core';

import { QuizQuestions } from './quiz-questions/quiz-questions.component';
import { QuizResultComponent } from './quiz-result/quiz-result.component';
import { QuizIntro } from './quiz-intro/quiz-intro.component';
import { IQuizCourse, ISubmitQuizData } from '../../../../models/courseWorkspace.model';

@Component({
  selector: 'app-tab-quiz',
  imports: [QuizResultComponent, QuizIntro, QuizQuestions],
  templateUrl: './tab-quiz.html',
  styleUrl: './tab-quiz.css',
})
export class TabQuiz {
  currentStep = signal<'intro' | 'question' | 'result'>('intro');
  selectedQuizSlug = signal('');
  selectedQuizName = signal('');
  quizResult = signal<ISubmitQuizData | null>(null);

  handleStartQuiz(quiz: IQuizCourse) {
    this.selectedQuizSlug.set(quiz.slug);
    this.selectedQuizName.set(quiz.quiz_name);
    this.quizResult.set(null);
    this.currentStep.set('question');
  }

  handleQuizSubmitted(result: ISubmitQuizData) {
    this.quizResult.set(result);
    this.currentStep.set('result');
  }

  handleBackToQuizList() {
    this.currentStep.set('intro');
  }

  handleRetake() {
    if (!this.selectedQuizSlug()) {
      this.currentStep.set('intro');
      return;
    }
    this.currentStep.set('question');
  }
}
