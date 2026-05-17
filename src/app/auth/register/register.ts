import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api-endpoints';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';
import { RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,RouterLinkActive],
  templateUrl: './register.html',
})
export class Register {
  registerForm: FormGroup;
  showPassword = signal(false);
  showConfirm  = signal(false);
  loading      = signal(false);

  constructor(
    private fb:     FormBuilder,
    private http:   HttpClient,
    private auth:   AuthService,
    private router: Router
  ) {
   
    this.registerForm = this.fb.group({
      first_name:      ['', Validators.required],
      last_name:       ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirm()  { this.showConfirm.update(v => !v); }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { confirmPassword, ...payload } = this.registerForm.value;

   this.auth.register(payload).subscribe({
      next: () => {
        sessionStorage.setItem('verify_email', payload.email);
        this.loading.set(false);
        Swal.fire({
          title: 'Account Created!',
          text: 'Please check your email to verify your account. Redirecting to verification page...',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => this.router.navigate(['/auth/verify-email']));
      },
      error: () => {
        this.loading.set(false);
        Swal.fire({
          title: 'Registration Failed',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
        });
      },
    });
  }
}
