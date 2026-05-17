import { Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-forget-pass',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forget-pass.html',
  styleUrl: './forget-pass.css',
})
export class ForgetPass {

  forgotForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email } = this.forgotForm.value;

    this.authService.forgotPassword(email).subscribe({

      next: (res: any) => {
        this.isLoading = false;
        sessionStorage.setItem('reset_email', email);

        Swal.fire({
          icon: 'success',
          title: 'Please check your email !',
          text: res.message || 'We have sent you a OTP',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.ngZone.run(() => {
            this.router.navigate(['/auth/reset-password']);
          });
        });
      },

      error: (err) => {
        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.error?.message || 'Something went wrong. Please try again.'
        });
      },
      complete: () => {
        this.isLoading = false;
      }

    });
  }

}
