import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Book } from '../../books/data/book.model';
import { Movement, MovementType } from '../data/movement.model';
import { MovementService } from '../data/movement.service';

export interface MovementFormDialogData {
  bookId: number | null;
  books: Book[];
}

@Component({
  selector: 'app-movement-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">Nuevo movimiento manual</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-1">
        <div class="flex flex-col gap-1.5">
          <label class="field-label">Libro</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="bookId">
              @for (book of data.books; track book.id) {
                <mat-option [value]="book.id">{{ book.isbn }} — {{ book.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex gap-3">
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="field-label">Tipo</label>
            <mat-form-field appearance="outline" class="field-select">
              <mat-select formControlName="movementType">
                <mat-option value="ENTRADA">Entrada</mat-option>
                <mat-option value="SALIDA">Salida</mat-option>
                <mat-option value="AJUSTE">Ajuste</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex flex-col gap-1.5 w-32">
            <label for="dlg-mv-quantity" class="field-label">Cantidad</label>
            <input id="dlg-mv-quantity" type="number" formControlName="quantity" class="field" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-mv-reason" class="field-label">Motivo</label>
          <input id="dlg-mv-reason" formControlName="reason" class="field" />
        </div>

        <p class="text-xs text-ink-muted">
          Ajuste admite cantidades negativas para corregir el stock; entrada/salida siempre son positivas.
        </p>
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
        Registrar
      </button>
    </mat-dialog-actions>
  `,
})
export class MovementFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<MovementFormDialog, Movement | undefined>);
  protected readonly data = inject<MovementFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly movementService = inject(MovementService);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    bookId: [this.data.bookId, Validators.required],
    movementType: ['ENTRADA' as MovementType, Validators.required],
    quantity: [0, Validators.required],
    reason: [''],
  });

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    this.movementService
      .create({
        bookId: value.bookId!,
        movementType: value.movementType,
        quantity: value.quantity,
        reason: value.reason,
      })
      .subscribe({
        next: (response) => this.dialogRef.close(response.data ?? undefined),
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }
}
