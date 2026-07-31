import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { PurchaseTabs } from '../../shared/components/purchase-tabs/purchase-tabs';
import { Supplier } from './data/supplier.model';
import { SupplierService } from './data/supplier.service';

@Component({
  selector: 'app-suppliers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatPaginatorModule, MatTableModule, PurchaseTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Proveedores</h1>
    <p class="text-sm text-ink-muted mb-6">Proveedores de libros para compras.</p>

    <app-purchase-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6" [class.spine]="!!editingId()">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
        {{ editingId() ? 'Editar proveedor' : 'Nuevo proveedor' }}
      </h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label for="sup-name" class="field-label">Nombre</label>
          <input id="sup-name" formControlName="name" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="sup-tax-id" class="field-label">RUC</label>
          <input
            id="sup-tax-id"
            formControlName="taxId"
            [readonly]="!!editingId()"
            class="field"
            [class.opacity-60]="!!editingId()"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="sup-phone" class="field-label">Teléfono</label>
          <input id="sup-phone" formControlName="phone" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="sup-email" class="field-label">Email</label>
          <input id="sup-email" type="email" formControlName="email" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 col-span-2">
          <label for="sup-address" class="field-label">Dirección</label>
          <input id="sup-address" formControlName="address" class="field" />
        </div>

        <div class="col-span-2 flex gap-2">
          <button
            mat-flat-button
            type="submit"
            style="background-color: var(--color-brand); color: white;"
            [disabled]="form.invalid"
          >
            {{ editingId() ? 'Actualizar' : 'Crear' }}
          </button>
          @if (editingId()) {
            <button mat-button type="button" (click)="cancelEdit()">Cancelar</button>
          }
        </div>
      </form>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-2">{{ errorMessage() }}</p>
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
            <button
              type="button"
              class="text-sm font-medium text-brand hover:underline"
              (click)="edit(supplier)"
            >
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
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);

  protected readonly columns = ['name', 'taxId', 'phone', 'email', 'status', 'actions'];
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
    address: [''],
  });

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

  protected edit(supplier: Supplier): void {
    this.editingId.set(supplier.id);
    this.form.setValue({
      name: supplier.name,
      taxId: supplier.taxId,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', taxId: '', phone: '', email: '', address: '' });
  }

  protected toggleStatus(supplier: Supplier): void {
    this.supplierService.updateStatus(supplier.id, !supplier.active).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const id = this.editingId();

    const operation = id
      ? this.supplierService.update(id, {
          name: value.name,
          phone: value.phone,
          email: value.email,
          address: value.address,
        })
      : this.supplierService.create({
          name: value.name,
          taxId: value.taxId,
          phone: value.phone,
          email: value.email,
          address: value.address,
        });

    operation.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
