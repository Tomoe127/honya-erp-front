import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Author } from '../../authors/data/author.model';
import { Category } from '../../categories/data/category.model';
import { Publisher } from '../../publishers/data/publisher.model';
import { Book } from '../data/book.model';
import { BookService } from '../data/book.service';

export interface BookFormDialogData {
  book: Book | null;
  categories: Category[];
  publishers: Publisher[];
  authors: Author[];
}

@Component({
  selector: 'app-book-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="font-serif text-lg font-semibold text-ink">
      {{ data.book ? 'Editar libro' : 'Nuevo libro' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="grid grid-cols-2 gap-3 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="dlg-book-isbn" class="field-label">ISBN</label>
          <input
            id="dlg-book-isbn"
            formControlName="isbn"
            [readonly]="!!data.book"
            class="field"
            [class.opacity-60]="!!data.book"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-book-title" class="field-label">Título</label>
          <input id="dlg-book-title" formControlName="title" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 col-span-2">
          <label for="dlg-book-description" class="field-label">Descripción</label>
          <input id="dlg-book-description" formControlName="description" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-book-price" class="field-label">Precio</label>
          <input id="dlg-book-price" type="number" step="0.01" formControlName="price" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="dlg-book-cost-price" class="field-label">Precio de costo</label>
          <input id="dlg-book-cost-price" type="number" step="0.01" formControlName="costPrice" class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="field-label">Categoría</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="categoryId">
              @for (category of data.categories; track category.id) {
                <mat-option [value]="category.id">{{ category.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="field-label">Editorial</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="publisherId">
              <mat-option [value]="0">Sin editorial</mat-option>
              @for (publisher of data.publishers; track publisher.id) {
                <mat-option [value]="publisher.id">{{ publisher.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1.5 col-span-2">
          <label class="field-label">Autores</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="authorIds" multiple>
              @for (author of data.authors; track author.id) {
                <mat-option [value]="author.id">{{ author.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
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
        {{ data.book ? 'Actualizar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class BookFormDialog {
  protected readonly dialogRef = inject(MatDialogRef<BookFormDialog, Book | undefined>);
  protected readonly data = inject<BookFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly bookService = inject(BookService);

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    isbn: [this.data.book?.isbn ?? '', Validators.required],
    title: [this.data.book?.title ?? '', Validators.required],
    description: [this.data.book?.description ?? ''],
    price: [this.data.book?.price ?? 0, [Validators.required, Validators.min(0)]],
    costPrice: [this.data.book?.costPrice ?? (null as number | null)],
    categoryId: [this.data.book?.categoryId ?? (null as number | null), Validators.required],
    publisherId: [this.data.book?.publisherId ?? 0],
    authorIds: [this.data.book?.authors.map((author) => author.id) ?? ([] as number[])],
  });

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      description: value.description,
      price: value.price,
      costPrice: value.costPrice,
      categoryId: value.categoryId!,
      publisherId: value.publisherId || null,
      authorIds: value.authorIds,
    };

    const operation = this.data.book
      ? this.bookService.update(this.data.book.id, payload)
      : this.bookService.create({ isbn: value.isbn, ...payload });

    operation.subscribe({
      next: (response) => this.dialogRef.close(response.data ?? undefined),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
