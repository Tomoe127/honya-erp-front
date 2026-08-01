import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Role } from '../data/role.model';
import { User } from '../data/user.model';
import { UserService } from '../data/user.service';

export interface UserFormDialogData {
  user: User | null;
  roles: Role[];
}

@Component({
  selector: 'app-user-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">
      {{ data.user ? 'Editar usuario' : 'Nuevo usuario' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="grid grid-cols-2 gap-3 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="dlg-user-username" class="field-label">Usuario</label>
          <input
            id="dlg-user-username"
            formControlName="username"
            [readonly]="!!data.user"
            class="field"
            [class.opacity-60]="!!data.user"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-user-fullname" class="field-label">Nombre completo</label>
          <input id="dlg-user-fullname" formControlName="fullName" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-user-email" class="field-label">Email</label>
          <input id="dlg-user-email" type="email" formControlName="email" class="field" />
        </div>

        @if (!data.user) {
          <div class="flex flex-col gap-1.5">
            <label for="dlg-user-password" class="field-label">Contraseña</label>
            <input id="dlg-user-password" type="password" formControlName="password" class="field" />
          </div>
        }

        <div class="flex flex-col gap-1.5 col-span-2">
          <label class="field-label">Roles</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="roleIds" multiple>
              @for (role of data.roles; track role.id) {
                <mat-option [value]="role.id">{{ role.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </form>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button
        mat-flat-button
        type="button"
        style="background-color: var(--color-brand); color: white;"
        [disabled]="form.invalid"
        (click)="submit()"
      >
        {{ data.user ? 'Actualizar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class UserFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<UserFormDialog, User | undefined>);
  protected readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: [this.data.user?.username ?? '', Validators.required],
    fullName: [this.data.user?.fullName ?? '', Validators.required],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    password: ['', this.data.user ? [] : [Validators.required, Validators.minLength(8)]],
    roleIds: [this.resolveInitialRoleIds(), Validators.required],
  });

  private resolveInitialRoleIds(): number[] {
    if (!this.data.user) {
      return [];
    }
    const roleNames = new Set(this.data.user.roles);
    return this.data.roles.filter((role) => roleNames.has(role.name)).map((role) => role.id);
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const user = this.data.user;

    const operation = user
      ? this.userService.update(user.id, {
          email: value.email,
          fullName: value.fullName,
          roleIds: value.roleIds,
        })
      : this.userService.create({
          username: value.username,
          email: value.email,
          password: value.password,
          fullName: value.fullName,
          roleIds: value.roleIds,
        });

    operation.subscribe({
      next: (response) => this.dialogRef.close(response.data ?? undefined),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
