import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly SLUG_KEY = 'user_slug';
  private readonly ACCESS_KEY = 'token';
  private accessToken: string | null = null;

  getAccessToken(): string | null { return localStorage.getItem(this.ACCESS_KEY) || this.accessToken; }
  setAccessToken(t: string): void { 
    this.accessToken = t; 
    localStorage.setItem(this.ACCESS_KEY, t); 
  }

  getRefreshToken(): string | null { return localStorage.getItem(this.REFRESH_KEY); }
  setRefreshToken(t: string): void { localStorage.setItem(this.REFRESH_KEY, t); }

  getSlug(): string | null { return localStorage.getItem(this.SLUG_KEY); }
  setSlug(s: string): void { localStorage.setItem(this.SLUG_KEY, s); }

  hasRefreshToken(): boolean { return !!this.getRefreshToken(); }

  clearAll(): void {
    this.accessToken = null;
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.SLUG_KEY);
    localStorage.removeItem(this.ACCESS_KEY);
  }
}