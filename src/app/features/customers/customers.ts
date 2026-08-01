import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { SaleTabs } from '../../shared/components/sale-tabs/sale-tabs';
import { Customer } from './data/customer.model';
import { CustomerService } from './data/customer.service';

@Component({
  selector: 'app-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatPaginatorModule, MatTableModule, SaleTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Clientes</h1>
    <p class="text-sm text-ink-muted mb-6">Clientes registrados para la venta.</p>

    <app-sale-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6" [class.spine]="!!editingId()">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
        {{ editingId() ? 'Editar cliente' : 'Nuevo cliente' }}
      </h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label for="cus-name" class="field-label">Nombre</label>
          <input id="cus-name" formControlName="name" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="cus-doc-type" class="field-label">Tipo de documento</label>
          <input id="cus-doc-type" formControlName="documentType" placeholder="DNI / RUC" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="cus-doc-number" class="field-label">Número de documento</label>
          <input
            id="cus-doc-number"
            formControlName="documentNumber"
            [readonly]="!!editingId()"
            class="field"
            [class.opacity-60]="!!editingId()"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="cus-phone" class="field-label">Teléfono</label>
          <input id="cus-phone" formControlName="phone" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="cus-email" class="field-label">Email</label>
          <input id="cus-email" type="email" formControlName="email" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="cus-address" class="field-label">Dirección</label>
          <input id="cus-address" formControlName="address" class="field" />
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
            <button type="button" class="text-sm font-medium text-brand hover:underline" (click)="edit(customer)">
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
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);

  protected readonly columns = ['name', 'document', 'phone', 'email', 'status', 'actions'];
  protected readonly customers = signal<Customer[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    documentType: ['', Validators.required],
    documentNumber: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
    address: [''],
  });

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

  protected edit(customer: Customer): void {
    this.editingId.set(customer.id);
    this.form.setValue({
      name: customer.name,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', documentType: '', documentNumber: '', phone: '', email: '', address: '' });
  }

  protected toggleStatus(customer: Customer): void {
    this.customerService.updateStatus(customer.id, !customer.active).subscribe({
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
      ? this.customerService.update(id, {
          name: value.name,
          documentType: value.documentType,
          phone: value.phone,
          email: value.email,
          address: value.address,
        })
      : this.customerService.create({
          name: value.name,
          documentType: value.documentType,
          documentNumber: value.documentNumber,
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
