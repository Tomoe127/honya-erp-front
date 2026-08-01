import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Customer } from '../data/customer.model';
import { CustomerService } from '../data/customer.service';

export interface CustomerFormDialogData {
  customer: Customer | null;
}

@Component({
  selector: 'app-customer-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">
      {{ data.customer ? 'Editar cliente' : 'Nuevo cliente' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="grid grid-cols-2 gap-3 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="dlg-cus-name" class="field-label">Nombre</label>
          <input id="dlg-cus-name" formControlName="name" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-cus-doc-type" class="field-label">Tipo de documento</label>
          <input id="dlg-cus-doc-type" formControlName="documentType" placeholder="DNI / RUC" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-cus-doc-number" class="field-label">Número de documento</label>
          <input
            id="dlg-cus-doc-number"
            formControlName="documentNumber"
            [readonly]="!!data.customer"
            class="field"
            [class.opacity-60]="!!data.customer"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-cus-phone" class="field-label">Teléfono</label>
          <input id="dlg-cus-phone" formControlName="phone" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-cus-email" class="field-label">Email</label>
          <input id="dlg-cus-email" type="email" formControlName="email" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-cus-address" class="field-label">Dirección</label>
          <input id="dlg-cus-address" formControlName="address" class="field" />
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
        {{ data.customer ? 'Actualizar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CustomerFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<CustomerFormDialog, Customer | undefined>);
  protected readonly data = inject<CustomerFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.customer?.name ?? '', Validators.required],
    documentType: [this.data.customer?.documentType ?? '', Validators.required],
    documentNumber: [this.data.customer?.documentNumber ?? '', Validators.required],
    phone: [this.data.customer?.phone ?? ''],
    email: [this.data.customer?.email ?? '', Validators.email],
    address: [this.data.customer?.address ?? ''],
  });

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const customer = this.data.customer;

    const operation = customer
      ? this.customerService.update(customer.id, {
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
      next: (response) => this.dialogRef.close(response.data ?? undefined),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
