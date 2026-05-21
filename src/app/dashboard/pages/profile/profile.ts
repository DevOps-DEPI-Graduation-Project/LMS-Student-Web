import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Settings } from '../../../user-services/settings';
import { AuthService } from '../../../auth/services/auth';
import { Student } from '../../../models/user.models';
import { ThemeService } from '../../../core/theme';
import Swal from 'sweetalert2';

import { ImgFallback } from '../../../shared/directives/img-fallback';
import { Skeleton } from '../../../components/shared/skeleton/skeleton';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ImgFallback, Skeleton],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {

  private destroyRef = inject(DestroyRef);

  profile = signal<Student | null>(null);
  isEditing = signal(false);
  saveSuccess = signal(false);
  loading = signal(false);
  fetching = signal(true);

  editForm!: FormGroup;

  constructor(
    private settings: Settings,
    private fb: FormBuilder,
    private auth: AuthService,
    private theme: ThemeService
  ) {
    this.editForm = this.buildForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.fetching.set(true);

    const cached = this.auth.currentUser();
    if (cached) {
      this.profile.set(cached);
      this.patchForm(cached);
      this.fetching.set(false);
      return;
    }

    this.auth.fetchCurrentUser().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (student) => {
        console.log('[Profile] student loaded:', student);
        if (student) {
          this.profile.set(student);
          this.patchForm(student);
        }
        this.fetching.set(false);
      },
      error: (err) => {
        this.fetching.set(false);
        console.error('[Profile] load error:', err);
        Swal.fire({ title: 'Error', text: 'Failed to load profile.', icon: 'error' });
      }
    });
  }

  private patchForm(s: Student): void {
    this.editForm.patchValue({
      first_name: s.first_name ?? '',
      last_name: s.last_name ?? '',
    });

    const currentTheme = localStorage.getItem('theme') || 'system';
    this.editForm.patchValue({ theme: currentTheme });
  }

  get fullName(): string {
    const p = this.profile();
    return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : '';
  }

  get initials(): string {
    const p = this.profile();
    if (!p) return 'S';
    return `${p.first_name?.charAt(0) ?? ''}${p.last_name?.charAt(0) ?? ''}`.toUpperCase() || 'S';
  }

  openEdit(): void {
    this.isEditing.set(true);
    this.saveSuccess.set(false);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    const p = this.profile();
    if (p) this.patchForm(p);
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }

  saveEdit(): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    const p = this.profile();
    if (!p) return;

    this.loading.set(true);

    this.settings.updateProfile(p.slug, this.editForm.value).subscribe({
      next: (updated) => {
        const current = this.profile();
        if (current) {
          this.profile.set({ ...current, ...updated });
          this.auth.currentUser.set({ ...current, ...updated });
        }


        this.isEditing.set(false);
        this.loading.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.loading.set(false);
        const serverErrors = err?.error;
        let errorText = 'Failed to update profile. Please try again.';
        if (serverErrors && typeof serverErrors === 'object') {
          errorText = Object.values(serverErrors).flat().join(' ') || errorText;
        }
        Swal.fire({ title: 'Error', text: errorText, icon: 'error' });
      },
    });
  }

  savePreferences(): void {
    const themeValue = this.editForm.value.theme;
    if (themeValue === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.setTheme(prefersDark ? 'dark' : 'light');
    } else {
      this.theme.setTheme(themeValue);
    }

    Swal.fire({
      title: 'Preferences Saved',
      text: 'Your theme preferences have been updated.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  onSignOut(): void {
    Swal.fire({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) this.auth.logout();
    });
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      theme: ['system'],
    });
  }
}