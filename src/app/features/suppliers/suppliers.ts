import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { PurchaseTabs } from '../../shared/components/purchase-tabs/purchase-tabs';
import { SupplierFormDialog } from './supplier-form-dialog/supplier-form-dialog';
import { Supplier } from './data/supplier.model';
import { SupplierService } from './data/supplier.service';

@Component({
  selector: 'app-suppliers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatPaginatorModule, MatTableModule, PurchaseTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Proveedores</h1>
    <p class="text-sm text-ink-muted mb-6">Proveedores de libros para compras.</p>

    <app-purchase-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Proveedores registrados</span>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          (click)="openCreateDialog()"
        >
          Nuevo proveedor
        </button>
      </div>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </div>

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="suppliers()" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let supplier" class="font-medium">{{ supplier.name }}</td>
        </ng-container>

        <ng-container matColumnDef="taxId">
          <th mat-header-cell *matHeaderCellDef>RUC</th>
          <td mat-cell *matCellDef="let supplier" class="tabular text-ink-muted">{{ supplier.taxId }}</td>
        </ng-container>

        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
          <td mat-cell *matCellDef="let supplier">{{ supplier.phone }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let supplier">{{ supplier.email }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let supplier">
            @if (supplier.active) {
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
          <td mat-cell *matCellDef="let supplier" class="text-right whitespace-nowrap">
            <button type="button" class="text-sm font-medium text-brand hover:underline" (click)="openEditDialog(supplier)">
              Editar
            </button>
            <button
              type="button"
              class="text-sm font-medium text-ink-soft hover:underline ml-3"
              (click)="toggleStatus(supplier)"
            >
              {{ supplier.active ? 'Desactivar' : 'Activar' }}
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
export class Suppliers {
  private readonly dialog = inject(MatDialog);
  private readonly supplierService = inject(SupplierService);

  protected readonly columns = ['name', 'taxId', 'phone', 'email', 'status', 'actions'];
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.supplierService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.suppliers.set(page.content);
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

  protected openEditDialog(supplier: Supplier): void {
    this.openDialog(supplier);
  }

  private openDialog(supplier: Supplier | null): void {
    const dialogRef = this.dialog.open(SupplierFormDialog, {
      width: '560px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { supplier },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  protected toggleStatus(supplier: Supplier): void {
    this.supplierService.updateStatus(supplier.id, !supplier.active).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
