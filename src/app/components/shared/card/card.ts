import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ImgFallback } from '../../../shared/directives/img-fallback';
import { ICourseCardData } from '../../../user-features/models/course.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [DecimalPipe, ImgFallback],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card {
  @Input({ required: true }) course!: ICourseCardData;

  /** Formats the price as "$X.XX" or "FREE" */
  get formattedPrice(): string {
    const p = this.course?.price;
    if (!p || p === '0.00' || p === '0') return 'FREE';
    return '$' + p;
  }

  /** Instructor initials (up to 2 letters) */
  get initials(): string {
    const name = this.course?.instructor_name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  /** Formatted student count: e.g. 1200 → "1.2k" */
  get studentsFormatted(): string {
    const n = this.course?.students_count ?? 0;
    return n > 999 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  /** Array of 5 star types ('full' | 'half' | 'empty') for the rating row */
  get stars(): ('full' | 'half' | 'empty')[] {
    const rating = Math.max(0, Math.min(5, this.course?.avg_rating ?? 0));
    const result: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        result.push('full');
      } else if (rating >= i - 0.5) {
        result.push('half');
      } else {
        result.push('empty');
      }
    }
    return result;
  }
}
