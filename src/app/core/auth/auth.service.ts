import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse } from './auth.model';
import { AuthStore } from './auth.store';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  private readonly baseUrl = '/api/auth';

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, request)
      .pipe(tap((response) => this.applySession(response.data)));
  }

  refresh(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(tap((response) => this.applySession(response.data)));
  }

  logout(): Observable<ApiResponse<void>> {
    const refreshToken = TokenStorage.getRefreshToken();
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/logout`, { refreshToken })
      .pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this.authStore.clear();
    TokenStorage.clearRefreshToken();
  }

  tryRestoreSession(): Observable<void> {
    if (!TokenStorage.getRefreshToken()) {
      return of(void 0);
    }
    return this.refresh().pipe(
      map(() => void 0),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  private applySession(data: LoginResponse | null): void {
    if (!data) {
      return;
    }
    this.authStore.setSession(data.accessToken, data.user);
    TokenStorage.setRefreshToken(data.refreshToken);
  }
}
