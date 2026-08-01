import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse } from './auth.model';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  private readonly baseUrl = '/api/auth';

  // Renovación en curso compartida: si varias peticiones fallan con 401 al
  // mismo tiempo, todas esperan esta misma llamada en vez de disparar una
  // renovación cada una (eso pisaba la sesión buena con el refresh token
  // rotado y de un solo uso). Se limpia en `finalize` para que la próxima
  // renovación arranque desde cero.
  private refreshInFlight$: Observable<ApiResponse<LoginResponse>> | null = null;

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, request, { withCredentials: true })
      .pipe(tap((response) => this.applySession(response.data)));
  }

  refresh(): Observable<ApiResponse<LoginResponse>> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.applySession(response.data)),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
  }

  logout(): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this.authStore.clear();
  }

  tryRestoreSession(): Observable<void> {
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
  }
}
