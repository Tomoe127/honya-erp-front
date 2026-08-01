import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Book } from '../../books/data/book.model';
import { Supplier } from '../../suppliers/data/supplier.model';
import { Purchase } from '../data/purchase.model';
import { PurchaseService } from '../data/purchase.service';

export interface PurchaseFormDialogData {
  suppliers: Supplier[];
  books: Book[];
}

@Component({
  selector: 'app-purchase-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">Nueva compra</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="pt-1">
        <div class="flex flex-col gap-1.5 mb-4 max-w-sm">
          <label class="field-label">Proveedor</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="supplierId">
              @for (supplier of data.suppliers; track supplier.id) {
                <mat-option [value]="supplier.id">{{ supplier.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div formArrayName="details" class="flex flex-col gap-2">
          @for (group of detailsArray.controls; track $index) {
            <div [formGroupName]="$index" class="flex flex-wrap gap-3 items-end">
              <div class="flex flex-col gap-1.5 min-w-[220px] flex-1">
                <label class="field-label">Libro</label>
                <mat-form-field appearance="outline" class="field-select">
                  <mat-select formControlName="bookId">
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
                <label class="field-label">Costo unitario</label>
                <input type="number" step="0.01" min="0" formControlName="unitCost" class="field w-32" />
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
      <span class="text-sm font-medium">Total: S/ {{ formTotal().toFixed(2) }}</span>
      <div class="flex gap-2">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          [disabled]="form.invalid"
          (click)="submit()"
        >
          Registrar compra
        </button>
      </div>
    </mat-dialog-actions>
  `,
})
export class PurchaseFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<PurchaseFormDialog, Purchase | undefined>);
  protected readonly data = inject<PurchaseFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly purchaseService = inject(PurchaseService);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    supplierId: [null as number | null, Validators.required],
    details: this.fb.array([this.createDetailGroup()]),
  });

  protected get detailsArray(): FormArray {
    return this.form.get('details') as FormArray;
  }

  private createDetailGroup() {
    return this.fb.nonNullable.group({
      bookId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  protected detailSubtotal(index: number): number {
    const group = this.detailsArray.at(index);
    const quantity = Number(group.get('quantity')?.value ?? 0);
    const unitCost = Number(group.get('unitCost')?.value ?? 0);
    return quantity * unitCost;
  }

  protected formTotal(): number {
    return this.detailsArray.controls.reduce((sum, group) => {
      const quantity = Number(group.get('quantity')?.value ?? 0);
      const unitCost = Number(group.get('unitCost')?.value ?? 0);
      return sum + quantity * unitCost;
    }, 0);
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

    this.purchaseService
      .create({
        supplierId: value.supplierId!,
        details: value.details.map((detail) => ({
          bookId: detail.bookId!,
          quantity: detail.quantity,
          unitCost: detail.unitCost,
        })),
      })
      .subscribe({
        next: (response) => this.dialogRef.close(response.data ?? undefined),
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }
}
