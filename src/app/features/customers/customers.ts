import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { SaleTabs } from '../../shared/components/sale-tabs/sale-tabs';
import { CustomerFormDialog } from './customer-form-dialog/customer-form-dialog';
import { Customer } from './data/customer.model';
import { CustomerService } from './data/customer.service';

@Component({
  selector: 'app-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatPaginatorModule, MatTableModule, SaleTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Clientes</h1>
    <p class="text-sm text-ink-muted mb-6">Clientes registrados para la venta.</p>

    <app-sale-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Clientes registrados</span>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          (click)="openCreateDialog()"
        >
          Nuevo cliente
        </button>
      </div>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </div>

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="customers()" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let customer" class="font-medium">{{ customer.name }}</td>
        </ng-container>

        <ng-container matColumnDef="document">
          <th mat-header-cell *matHeaderCellDef>Documento</th>
          <td mat-cell *matCellDef="let customer" class="tabular text-ink-muted">
            {{ customer.documentType }} {{ customer.documentNumber }}
          </td>
        </ng-container>

        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
          <td mat-cell *matCellDef="let customer">{{ customer.phone }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let customer">{{ customer.email }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let customer">
            @if (customer.active) {
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
          <td mat-cell *matCellDef="let customer" class="text-right whitespace-nowrap">
            <button type="button" class="text-sm font-medium text-brand hover:underline" (click)="openEditDialog(customer)">
              Editar
            </button>
            <button
              type="button"
              class="text-sm font-medium text-ink-soft hover:underline ml-3"
              (click)="toggleStatus(customer)"
            >
              {{ customer.active ? 'Desactivar' : 'Activar' }}
            </button>
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
export class Customers {
  private readonly dialog = inject(MatDialog);
  private readonly customerService = inject(CustomerService);

  protected readonly columns = ['name', 'document', 'phone', 'email', 'status', 'actions'];
  protected readonly customers = signal<Customer[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.customerService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.customers.set(page.content);
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

  protected openEditDialog(customer: Customer): void {
    this.openDialog(customer);
  }

  private openDialog(customer: Customer | null): void {
    const dialogRef = this.dialog.open(CustomerFormDialog, {
      width: '560px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { customer },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  protected toggleStatus(customer: Customer): void {
    this.customerService.updateStatus(customer.id, !customer.active).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
