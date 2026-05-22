import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ISubmitQuizData } from '../../../../../models/courseWorkspace.model';


@Component({
  selector: 'app-quiz-result',
  imports: [],
  templateUrl: './quiz-result.component.html',
  styleUrls: ['./quiz-result.component.css']
})
export class QuizResultComponent implements OnInit {
  @Input() result: ISubmitQuizData | null = null;
  @Input() quizName = '';
  @Output() retry = new EventEmitter<void>();
  @Output() backToList = new EventEmitter<void>();

  constructor() { }

  ngOnInit() {
  }

  get scorePercent(): number {
    if (!this.result || !this.result.total_mark) {
      return 0;
    }
    return Math.round((this.result.score / this.result.total_mark) * 100);
  }

  get statusLabel(): string {
    return this.result?.status === 'passed' ? 'Passed' : 'Failed';
  }
}
