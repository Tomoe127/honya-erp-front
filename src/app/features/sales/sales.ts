import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Book } from '../books/data/book.model';
import { BookService } from '../books/data/book.service';
import { Customer } from '../customers/data/customer.model';
import { CustomerService } from '../customers/data/customer.service';
import { SaleTabs } from '../../shared/components/sale-tabs/sale-tabs';
import { PaymentMethod, Sale } from './data/sale.model';
import { SaleService } from './data/sale.service';

@Component({
  selector: 'app-sales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    SaleTabs,
  ],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Ventas</h1>
    <p class="text-sm text-ink-muted mb-6">Registro de ventas; valida stock y decrementa inventario.</p>

    <app-sale-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6" [class.spine]="showForm()">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Nueva venta</h2>
        @if (!showForm()) {
          <button
            mat-flat-button
            type="button"
            style="background-color: var(--color-brand); color: white;"
            (click)="startCreate()"
          >
            Nueva venta
          </button>
        }
      </div>

      @if (showForm()) {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="flex flex-wrap gap-3 mb-4">
            <div class="flex flex-col gap-1.5 min-w-[240px]">
              <label class="field-label">Cliente</label>
              <mat-form-field appearance="outline" class="field-select">
                <mat-select formControlName="customerId">
                  <mat-option [value]="null">Cliente genérico</mat-option>
                  @for (customer of activeCustomers(); track customer.id) {
                    <mat-option [value]="customer.id">{{ customer.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="flex flex-col gap-1.5 min-w-[200px]">
              <label class="field-label">Método de pago</label>
              <mat-form-field appearance="outline" class="field-select">
                <mat-select formControlName="paymentMethod">
                  <mat-option value="CASH">Efectivo</mat-option>
                  <mat-option value="CARD">Tarjeta</mat-option>
                  <mat-option value="TRANSFER">Transferencia</mat-option>
                  <mat-option value="DIGITAL_WALLET">Billetera digital</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div formArrayName="details" class="flex flex-col gap-2">
            @for (group of detailsArray.controls; track $index) {
              <div [formGroupName]="$index" class="flex flex-wrap gap-3 items-end">
                <div class="flex flex-col gap-1.5 min-w-[220px] flex-1">
                  <label class="field-label">Libro</label>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-select formControlName="bookId" (selectionChange)="onBookSelected($index, $event.value)">
                      @for (book of books(); track book.id) {
                        <mat-option [value]="book.id">{{ book.isbn }} — {{ book.title }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="field-label">Cantidad</label>
                  <input type="number" min="1" formControlName="quantity" class="field w-24" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="field-label">Precio unitario</label>
                  <input type="number" step="0.01" min="0" formControlName="unitPrice" class="field w-32" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="field-label">Descuento</label>
                  <input type="number" step="0.01" min="0" formControlName="discount" class="field w-28" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <span class="field-label">Subtotal</span>
                  <span class="tabular text-sm py-2">S/ {{ detailSubtotal($index).toFixed(2) }}</span>
                </div>

                <button
                  mat-button
                  type="button"
                  [disabled]="detailsArray.length === 1"
                  (click)="removeDetailRow($index)"
                >
                  Quitar
                </button>
              </div>
            }
          </div>

          <button mat-button type="button" class="mt-2" (click)="addDetailRow()">Agregar libro</button>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <div class="text-sm text-ink-muted">
              Subtotal: S/ {{ formSubtotal().toFixed(2) }} &middot; Descuento: S/ {{ formDiscount().toFixed(2) }}
              <span class="font-medium text-ink"> &middot; Total: S/ {{ formTotal().toFixed(2) }}</span>
            </div>
            <div class="flex gap-2">
              <button
                mat-flat-button
                type="submit"
                style="background-color: var(--color-brand); color: white;"
                [disabled]="form.invalid"
              >
                Registrar venta
              </button>
              <button mat-button type="button" (click)="cancelCreate()">Cancelar</button>
            </div>
          </div>
        </form>
      }

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </div>

    @if (expandedSale(); as sale) {
      <div class="rounded-lg border border-line bg-paper p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Detalle venta #{{ sale.id }} — {{ sale.customerName ?? 'Cliente genérico' }}
          </h2>
          <button mat-button type="button" (click)="expandedSale.set(null)">Cerrar</button>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-muted border-b border-line">
              <th class="py-1.5">ISBN</th>
              <th class="py-1.5">Título</th>
              <th class="py-1.5">Cantidad</th>
              <th class="py-1.5">Precio unitario</th>
              <th class="py-1.5">Descuento</th>
              <th class="py-1.5">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (detail of sale.details; track detail.bookId) {
              <tr class="border-b border-line last:border-0">
                <td class="py-1.5 tabular text-ink-muted">{{ detail.bookIsbn }}</td>
                <td class="py-1.5 font-medium">{{ detail.bookTitle }}</td>
                <td class="py-1.5 tabular">{{ detail.quantity }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.unitPrice.toFixed(2) }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.discount.toFixed(2) }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.subtotal.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="sales()" class="w-full">
        <ng-container matColumnDef="saleDate">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let sale" class="tabular text-ink-muted">
            {{ sale.saleDate | date: 'dd/MM/yyyy HH:mm' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="customerName">
          <th mat-header-cell *matHeaderCellDef>Cliente</th>
          <td mat-cell *matCellDef="let sale" class="font-medium">{{ sale.customerName ?? 'Cliente genérico' }}</td>
        </ng-container>

        <ng-container matColumnDef="paymentMethod">
          <th mat-header-cell *matHeaderCellDef>Pago</th>
          <td mat-cell *matCellDef="let sale">{{ paymentMethodLabel(sale.paymentMethod) }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let sale" class="tabular">S/ {{ sale.total.toFixed(2) }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let sale">
            @if (sale.status === 'COMPLETED') {
              <span
                class="inline-flex items-center rounded-full bg-success-soft text-success text-xs font-medium px-2.5 py-1"
              >
                Completada
              </span>
            } @else {
              <span
                class="inline-flex items-center rounded-full bg-danger-soft text-danger text-xs font-medium px-2.5 py-1"
              >
                Cancelada
              </span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let sale" class="text-right whitespace-nowrap">
            <button
              type="button"
              class="text-sm font-medium text-brand hover:underline"
              (click)="expandedSale.set(sale)"
            >
              Ver detalle
            </button>
            @if (sale.status === 'COMPLETED') {
              <button
                type="button"
                class="text-sm font-medium text-danger hover:underline ml-3"
                (click)="cancelSale(sale)"
              >
                Cancelar
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
export class Sales {
  private readonly fb = inject(FormBuilder);
  private readonly saleService = inject(SaleService);
  private readonly customerService = inject(CustomerService);
  private readonly bookService = inject(BookService);

  protected readonly columns = ['saleDate', 'customerName', 'paymentMethod', 'total', 'status', 'actions'];
  protected readonly sales = signal<Sale[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly showForm = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly expandedSale = signal<Sale | null>(null);

  protected readonly books = signal<Book[]>([]);
  protected readonly activeCustomers = signal<Customer[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    customerId: [null as number | null],
    paymentMethod: ['CASH' as PaymentMethod, Validators.required],
    details: this.fb.array([this.createDetailGroup()]),
  });

  protected get detailsArray(): FormArray {
    return this.form.get('details') as FormArray;
  }

  constructor() {
    this.loadOptions();
    this.load();
  }

  private createDetailGroup() {
    return this.fb.nonNullable.group({
      bookId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      discount: [0, [Validators.min(0)]],
    });
  }

  private loadOptions(): void {
    this.bookService.search({ status: 'ACTIVE' }, 0, 200).subscribe((response) => {
      if (response.data) {
        this.books.set(response.data.content);
      }
    });
    this.customerService.list(0, 200).subscribe((response) => {
      if (response.data) {
        this.activeCustomers.set(response.data.content.filter((customer) => customer.active));
      }
    });
  }

  private load(): void {
    this.saleService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.sales.set(page.content);
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

  protected onBookSelected(index: number, bookId: number): void {
    const book = this.books().find((b) => b.id === bookId);
    if (book) {
      this.detailsArray.at(index).get('unitPrice')?.setValue(book.price);
    }
  }

  protected detailSubtotal(index: number): number {
    const group = this.detailsArray.at(index);
    const quantity = Number(group.get('quantity')?.value ?? 0);
    const unitPrice = Number(group.get('unitPrice')?.value ?? 0);
    const discount = Number(group.get('discount')?.value ?? 0);
    return quantity * unitPrice - discount;
  }

  protected formSubtotal(): number {
    return this.detailsArray.controls.reduce((sum, group) => {
      const quantity = Number(group.get('quantity')?.value ?? 0);
      const unitPrice = Number(group.get('unitPrice')?.value ?? 0);
      return sum + quantity * unitPrice;
    }, 0);
  }

  protected formDiscount(): number {
    return this.detailsArray.controls.reduce((sum, group) => sum + Number(group.get('discount')?.value ?? 0), 0);
  }

  protected formTotal(): number {
    return this.formSubtotal() - this.formDiscount();
  }

  protected addDetailRow(): void {
    this.detailsArray.push(this.createDetailGroup());
  }

  protected removeDetailRow(index: number): void {
    if (this.detailsArray.length > 1) {
      this.detailsArray.removeAt(index);
    }
  }

  protected startCreate(): void {
    this.errorMessage.set(null);
    this.form.reset({ customerId: null, paymentMethod: 'CASH' });
    this.detailsArray.clear();
    this.detailsArray.push(this.createDetailGroup());
    this.showForm.set(true);
  }

  protected cancelCreate(): void {
    this.showForm.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();

    this.saleService
      .create({
        customerId: value.customerId,
        paymentMethod: value.paymentMethod,
        details: value.details.map((detail) => ({
          bookId: detail.bookId!,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          discount: detail.discount,
        })),
      })
      .subscribe({
        next: () => {
          this.showForm.set(false);
          this.pageIndex.set(0);
          this.load();
        },
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }

  protected cancelSale(sale: Sale): void {
    this.saleService.cancel(sale.id).subscribe({
      next: () => {
        this.expandedSale.set(null);
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  protected paymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'CARD':
        return 'Tarjeta';
      case 'TRANSFER':
        return 'Transferencia';
      case 'DIGITAL_WALLET':
        return 'Billetera digital';
    }
  }
}
