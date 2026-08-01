import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { AuthStore } from '../../core/auth/auth.store';
import { Role } from './data/role.model';
import { RoleService } from './data/role.service';
import { User } from './data/user.model';
import { UserService } from './data/user.service';
import { UserFormDialog } from './user-form-dialog/user-form-dialog';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatPaginatorModule, MatTableModule],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Usuarios</h1>
    <p class="text-sm text-ink-muted mb-6">Cuentas del sistema y sus roles.</p>

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Usuarios registrados</span>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          (click)="openCreateDialog()"
        >
          Nuevo usuario
        </button>
      </div>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </div>

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="users()" class="w-full">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Usuario</th>
          <td mat-cell *matCellDef="let user" class="font-medium tabular">{{ user.username }}</td>
        </ng-container>

        <ng-container matColumnDef="fullName">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let user">{{ user.fullName }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{ user.email }}</td>
        </ng-container>

        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>Roles</th>
          <td mat-cell *matCellDef="let user">{{ user.roles.join(', ') }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let user">
            @if (user.active) {
              <span
                class="inline-flex items-center rounded-full bg-success-soft text-success text-xs font-medium px-2.5 py-1"
              >
                Activo
              </span>
            } @else {
              <span
                class="inline-flex items-center rounded-full bg-danger-soft text-danger text-xs font-medium px-2.5 py-1"
              >
                Inactivo
              </span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let user" class="text-right whitespace-nowrap">
            <button type="button" class="text-sm font-medium text-brand hover:underline" (click)="openEditDialog(user)">
              Editar
            </button>
            @if (user.username !== authStore.currentUser()?.username) {
              <button
                type="button"
                class="text-sm font-medium text-ink-soft hover:underline ml-3"
                (click)="toggleStatus(user)"
              >
                {{ user.active ? 'Desactivar' : 'Activar' }}
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      <mat-paginator
        [length]="totalElements()"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="onPageChange($event)"
      />
    </div>
  `,
})
export class Users {
  private readonly dialog = inject(MatDialog);
  protected readonly authStore = inject(AuthStore);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);

  protected readonly columns = ['username', 'fullName', 'email', 'roles', 'status', 'actions'];
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadRoles();
    this.load();
  }

  private loadRoles(): void {
    this.roleService.listAll().subscribe((response) => {
      if (response.data) {
        this.roles.set(response.data);
      }
    });
  }

  private load(): void {
    this.userService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.users.set(page.content);
          this.totalElements.set(page.totalElements);
        }
      },
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected openCreateDialog(): void {
    this.openDialog(null);
  }

  protected openEditDialog(user: User): void {
    this.openDialog(user);
  }

  private openDialog(user: User | null): void {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '560px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { user, roles: this.roles() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  protected toggleStatus(user: User): void {
    this.userService.updateStatus(user.id, !user.active).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
