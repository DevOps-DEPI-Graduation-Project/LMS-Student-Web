import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail {

  otpForm!: FormGroup;
  otpControls = Array(6);
  isLoading = false;
  countdown = 30;
  private countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    const group: any = {};

    for (let i = 0; i < 6; i++) {
      group[`digit${i}`] = ['', [Validators.required, Validators.pattern(/^\d$/)]];
    }

    this.otpForm = this.fb.group(group);
  }

  ngOnInit() {

    const email = sessionStorage.getItem('verify_email');

    if (!email) {
      this.router.navigate(['/auth/register']);
      return;
    }

    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 1);

    input.value = value;
    this.otpForm.get(`digit${index}`)?.setValue(value);

    if (value && index < this.otpControls.length - 1) {
      const allInputs = input.closest('div')?.querySelectorAll<HTMLInputElement>('input');
      allInputs?.[index + 1]?.focus();
    }
  }
  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      const current = this.otpForm.get(`digit${index}`);

      if (!current?.value && index > 0) {
        const allInputs = input.closest('div')?.querySelectorAll<HTMLInputElement>('input');
        allInputs?.[index - 1]?.focus();
      }
    }
  }
  onPaste(event: ClipboardEvent) {

    event.preventDefault();

    const pasted = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, this.otpControls.length) ?? '';

    const inputs = document.querySelectorAll<HTMLInputElement>('input[formcontrolname]');

    pasted.split('').forEach((char, i) => {

      this.otpForm.get(`digit${i}`)?.setValue(char);

      if (inputs[i]) {
        inputs[i].value = char;
      }

    });

    inputs[Math.min(pasted.length, this.otpControls.length - 1)]?.focus();

  }
  get formattedCountdown(): string {
    const minutes = Math.floor(this.countdown / 60)
      .toString()
      .padStart(2, '0');

    const seconds = (this.countdown % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${seconds}`;
  }

  startCountdown() {
    this.countdown = 30;
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }
  resendOtp() {
    const email = sessionStorage.getItem('verify_email');

    if (!email) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Email not found. Please register again.'
      });
      this.router.navigate(['/auth/register']);
      return;
    }

    this.authService.resendOtp({ email }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'OTP Resent',
          text: 'A new verification code has been sent to your email.'
        });
        this.startCountdown();
      },
      error: (err: HttpErrorResponse) => {
        Swal.fire({
          icon: 'error',
          title: 'Resend Failed',
          text: err.error?.message || 'Failed to resend OTP'
        });
      }
    });
  }
  onSubmit() {

    if (this.otpForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete code',
        text: 'Please enter all digits'
      });
      return;
    }

    this.isLoading = true;

    const otp = Object.values(this.otpForm.value).join('');
    const email = sessionStorage.getItem('verify_email') ?? '';

    this.authService.verifyEmail({ email, otp }).subscribe({

      next: (res: any) => {

        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: 'Email verified successfully!',
          timer: 1500,
          showConfirmButton: false
        });

        this.router.navigate(['/auth/login']);
      },

      error: (err: HttpErrorResponse) => {

        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: err.error?.message || 'Invalid or expired OTP'
        });

      }

    });

  }

}