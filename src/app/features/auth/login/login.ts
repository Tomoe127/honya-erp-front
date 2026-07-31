import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center">
      <div
        class="spine w-full max-w-md rounded-lg bg-paper px-9 py-10"
        style="box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04);"
      >
        <div class="flex items-center gap-3.5 mb-8">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-brand">
            <mat-icon class="text-white! text-[24px]! w-[24px]! h-[24px]!">auto_stories</mat-icon>
          </span>
          <div>
            <h1 class="font-serif text-xl font-semibold tracking-tight text-ink leading-tight">
              Honya ERP
            </h1>
            <p class="text-sm text-ink-muted leading-tight">Sistema de gestión para librerías</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="username" class="field-label">
              Usuario
            </label>
            <input
              id="username"
              formControlName="username"
              autocomplete="username"
              autofocus
              class="field"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="password" class="field-label">
              Contraseña
            </label>
            <div class="relative">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                class="field pr-11"
              />
              <button
                mat-icon-button
                type="button"
                tabindex="-1"
                class="absolute! right-1! top-1/2! -translate-y-1/2!"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <mat-icon class="text-ink-muted! text-[20px]! w-[20px]! h-[20px]!">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </button>
            </div>
          </div>

          @if (errorMessage()) {
            <p class="text-sm text-danger -mt-1.5">{{ errorMessage() }}</p>
          }

          <button
            mat-flat-button
            type="submit"
            class="mt-1! h-11!"
            style="background-color: var(--color-brand); color: white;"
            [disabled]="form.invalid || loading()"
          >
            @if (loading()) {
              <span class="login-spinner" aria-hidden="true"></span>
            } @else {
              Ingresar
            }
          </button>
        </form>
      </div>

      <p class="text-xs text-ink-muted mt-6">Honya ERP · Uso interno</p>
    </div>
  `,
  styles: `
    .login-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: login-spin 0.7s linear infinite;
    }

    @keyframes login-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }
}
