import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Book } from '../../books/data/book.model';
import { Customer } from '../../customers/data/customer.model';
import { PaymentMethod, Sale } from '../data/sale.model';
import { SaleService } from '../data/sale.service';

export interface SaleFormDialogData {
  customers: Customer[];
  books: Book[];
}

const GENERIC_CUSTOMER = 0;

@Component({
  selector: 'app-sale-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">Nueva venta</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="pt-1">
        <div class="flex flex-wrap gap-3 mb-4">
          <div class="flex flex-col gap-1.5 min-w-[240px]">
            <label class="field-label">Cliente</label>
            <mat-form-field appearance="outline" class="field-select">
              <mat-select formControlName="customerId">
                <mat-option [value]="genericCustomer">Cliente genérico</mat-option>
                @for (customer of data.customers; track customer.id) {
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
                    @for (book of data.books; track book.id) {
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
      </form>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="flex! items-center! justify-between!">
      <div class="text-sm text-ink-muted">
        Subtotal: S/ {{ formSubtotal().toFixed(2) }} &middot; Descuento: S/ {{ formDiscount().toFixed(2) }}
        <span class="font-medium text-ink"> &middot; Total: S/ {{ formTotal().toFixed(2) }}</span>
      </div>
      <div class="flex gap-2">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          [disabled]="form.invalid"
          (click)="submit()"
        >
          Registrar venta
        </button>
      </div>
    </mat-dialog-actions>
  `,
})
export class SaleFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<SaleFormDialog, Sale | undefined>);
  protected readonly data = inject<SaleFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly saleService = inject(SaleService);

  protected readonly genericCustomer = GENERIC_CUSTOMER;
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    customerId: [GENERIC_CUSTOMER],
    paymentMethod: ['CASH' as PaymentMethod, Validators.required],
    details: this.fb.array([this.createDetailGroup()]),
  });

  protected get detailsArray(): FormArray {
    return this.form.get('details') as FormArray;
  }

  private createDetailGroup() {
    return this.fb.nonNullable.group({
      bookId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      discount: [0, [Validators.min(0)]],
    });
  }

  protected onBookSelected(index: number, bookId: number): void {
    const book = this.data.books.find((b) => b.id === bookId);
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

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();

    this.saleService
      .create({
        customerId: value.customerId || null,
        paymentMethod: value.paymentMethod,
        details: value.details.map((detail) => ({
          bookId: detail.bookId!,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          discount: detail.discount,
        })),
      })
      .subscribe({
        next: (response) => this.dialogRef.close(response.data ?? undefined),
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }
}
