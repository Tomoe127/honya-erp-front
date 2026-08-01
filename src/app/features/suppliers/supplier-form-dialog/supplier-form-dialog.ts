import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Supplier } from '../data/supplier.model';
import { SupplierService } from '../data/supplier.service';

export interface SupplierFormDialogData {
  supplier: Supplier | null;
}

@Component({
  selector: 'app-supplier-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">
      {{ data.supplier ? 'Editar proveedor' : 'Nuevo proveedor' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="grid grid-cols-2 gap-3 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="dlg-sup-name" class="field-label">Nombre</label>
          <input id="dlg-sup-name" formControlName="name" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-sup-tax-id" class="field-label">RUC</label>
          <input
            id="dlg-sup-tax-id"
            formControlName="taxId"
            [readonly]="!!data.supplier"
            class="field"
            [class.opacity-60]="!!data.supplier"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-sup-phone" class="field-label">Teléfono</label>
          <input id="dlg-sup-phone" formControlName="phone" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-sup-email" class="field-label">Email</label>
          <input id="dlg-sup-email" type="email" formControlName="email" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 col-span-2">
          <label for="dlg-sup-address" class="field-label">Dirección</label>
          <input id="dlg-sup-address" formControlName="address" class="field" />
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
        {{ data.supplier ? 'Actualizar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class SupplierFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<SupplierFormDialog, Supplier | undefined>);
  protected readonly data = inject<SupplierFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.supplier?.name ?? '', Validators.required],
    taxId: [this.data.supplier?.taxId ?? '', Validators.required],
    phone: [this.data.supplier?.phone ?? ''],
    email: [this.data.supplier?.email ?? '', Validators.email],
    address: [this.data.supplier?.address ?? ''],
  });

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const supplier = this.data.supplier;

    const operation = supplier
      ? this.supplierService.update(supplier.id, {
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
      next: (response) => this.dialogRef.close(response.data ?? undefined),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
