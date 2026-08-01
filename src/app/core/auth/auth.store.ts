import { Injectable, computed, signal } from '@angular/core';
import { AuthUser } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly roles = computed(() => this._currentUser()?.roles ?? []);

  setSession(accessToken: string, user: AuthUser): void {
    this._accessToken.set(accessToken);
    this._currentUser.set(user);
  }

  updateAccessToken(accessToken: string): void {
    this._accessToken.set(accessToken);
  }

  clear(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(...allowedRoles: string[]): boolean {
    return allowedRoles.some((role) => this.roles().includes(role));
  }
}
