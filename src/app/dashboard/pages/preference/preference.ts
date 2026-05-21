import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import Swal from 'sweetalert2';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/theme';

@Component({
  selector: 'app-preference',
  imports: [ReactiveFormsModule, CommonModule],
 template: '',
  styles: [],
})
export class Preference {

  form: FormGroup;
  saved = signal(false);

  public languages = ['English', 'Arabic'];

  constructor(private fb: FormBuilder, private theme: ThemeService) {
    this.form = this.fb.group({
      language: ['English'],
      theme: ['system'],
      emailNotifications: [true],
    });

    const currentTheme = localStorage.getItem('theme') || 'system';
    this.form.patchValue({ theme: currentTheme });
  }

  save(): void {
    const themeValue = this.form.value.theme;
    if (themeValue === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.setTheme(prefersDark ? 'dark' : 'light');
    } else {
      this.theme.setTheme(themeValue);
    }

    Swal.fire({
      title: 'Preferences Saved',
      text: 'Your preferences have been updated successfully.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }
}
