import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of, switchMap, catchError, map, BehaviorSubject } from 'rxjs';
import { API_ENDPOINTS } from '../../core/api-endpoints';
import { Student } from '../../models/user.models';
import { TokenService } from './token';
import {
  LoginRequest, LoginResponse,
  ResetPasswordRequest, ResetPasswordResponse,
  RegisterRequest, RegisterResponse,
  VerifyEmailRequest, VerifyEmailResponse,
  ResendOtpRequest, ResendOtpResponse,
  TokenRefreshResponse, CheckTokenResponse,
} from '../models/auth.models';

interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  isLoggedIn = signal<boolean>(false);
  currentUser = signal<Student | null>(null);

  private authReadySubject = new BehaviorSubject<Student | null | undefined>(undefined);
  readonly authReady$ = this.authReadySubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  // ─── Initialize Auth ──────────────────────────────────────────────────────
  private initializeAuth(): void {
    const accessToken = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.isLoggedIn.set(false);
      this.authReadySubject.next(null);
      return;
    }

    const authFlow$ = accessToken
      ? this.checkTokenValidity().pipe(
        switchMap((isValid) => {
          if (isValid) return this.fetchCurrentUser();
          return this.refreshAccessToken().pipe(
            switchMap(() => this.fetchCurrentUser())
          );
        })
      )
      : this.refreshAccessToken().pipe(
        switchMap(() => this.fetchCurrentUser())
      );

    authFlow$.pipe(
      tap((user) => {
        this.isLoggedIn.set(!!user);
        this.authReadySubject.next(user);
      }),
      catchError((err) => {
        const status = err?.status;
        if (status === 401 || status === 403) {
          this.tokenService.clearAll();
        }
        this.isLoggedIn.set(false);
        this.authReadySubject.next(null);
        return of(null);
      })
    ).subscribe();
  }

  // ─── Check Token Validity ─────────────────────────────────────────────────
  checkTokenValidity(): Observable<boolean> {
    return this.http.get<CheckTokenResponse>(API_ENDPOINTS.checkToken).pipe(
      map(res => res.data?.valid === true),
      catchError(() => of(false))
    );
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(API_ENDPOINTS.register, data);
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────
  verifyEmail(data: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(API_ENDPOINTS.verifyEmail, data);
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────
  resendOtp(data: ResendOtpRequest): Observable<ResendOtpResponse> {
    return this.http.post<ResendOtpResponse>(API_ENDPOINTS.resendOtp, data);
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  login(data: LoginRequest): Observable<Student | null> {
    return this.http.post<LoginResponse>(API_ENDPOINTS.login, data).pipe(

      tap((res) => {
        const { tokens, user } = res.data;

        this.tokenService.setAccessToken(tokens.access);
        this.tokenService.setRefreshToken(tokens.refresh);
        this.tokenService.setSlug(user.slug);
        this.isLoggedIn.set(true);

        const partialStudent: Student = {
          ...user,
          is_verified: true,
          image: null
        };

        this.currentUser.set(partialStudent);
        this.authReadySubject.next(partialStudent);
      }),

      switchMap(() =>
        this.fetchCurrentUser().pipe(
          catchError((err) => {
            console.warn('fetchCurrentUser failed, using login data instead:', err);
            return of(this.currentUser());
          })
        )
      )

    );
  }

  // ─── Refresh Access Token ─────────────────────────────────────────────────
  refreshAccessToken(): Observable<TokenRefreshResponse> {
    const refresh = this.tokenService.getRefreshToken() ?? '';
    return this.http.post<TokenRefreshResponse>(
      API_ENDPOINTS.refreshToken, { refresh }
    ).pipe(
      tap((res) => {
        this.tokenService.setAccessToken(res.access);
      })
    );
  }

  // ─── Fetch Current User ───────────────────────────────────────────────────
  fetchCurrentUser(): Observable<Student | null> {
    const slug = this.tokenService.getSlug();
    if (!slug) return of(null);

    return this.http.get<ApiResponse<Student>>(API_ENDPOINTS.studentBySlug(slug)).pipe(
      map((res) => {
        const user: Student = (res as any)?.data ?? res;
        this.currentUser.set(user);
        return user;
      })
    );
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────
  forgotPassword(email: string): Observable<any> {
    return this.http.post(API_ENDPOINTS.forgotPassword, { email });
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(API_ENDPOINTS.resetPassword, data);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout(): void {
    const refresh = this.tokenService.getRefreshToken() ?? '';
    this.http.post(API_ENDPOINTS.logout, { refresh }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  // ─── Clear Session ────────────────────────────
  private clearSession(): void {
    this.tokenService.clearAll();
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.authReadySubject.next(null);
    this.router.navigate(['/']);
  }
}