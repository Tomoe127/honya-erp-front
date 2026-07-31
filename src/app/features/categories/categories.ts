import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CatalogTabs } from '../../shared/components/catalog-tabs/catalog-tabs';
import { Category } from './data/category.model';
import { CategoryService } from './data/category.service';

@Component({
  selector: 'app-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatPaginatorModule, MatTableModule, CatalogTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Categorías</h1>
    <p class="text-sm text-ink-muted mb-6">Clasificación temática del catálogo de libros.</p>

    <app-catalog-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6" [class.spine]="!!editingId()">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
        {{ editingId() ? 'Editar categoría' : 'Nueva categoría' }}
      </h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1.5 min-w-[220px]">
          <label for="cat-name" class="field-label">Nombre</label>
          <input id="cat-name" formControlName="name" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 flex-1 min-w-[240px]">
          <label for="cat-description" class="field-label">Descripción</label>
          <input id="cat-description" formControlName="description" class="field" />
        </div>

        <div class="flex gap-2">
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
      <table mat-table [dataSource]="categories()" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let category">{{ category.name }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descripción</th>
          <td mat-cell *matCellDef="let category">{{ category.description }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let category" class="text-right">
            <button
              type="button"
              class="text-sm font-medium text-brand hover:underline"
              (click)="edit(category)"
            >
              Editar
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
export class Categories {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  protected readonly columns = ['name', 'description', 'actions'];
  protected readonly categories = signal<Category[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.categoryService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.categories.set(page.content);
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

  protected edit(category: Category): void {
    this.editingId.set(category.id);
    this.form.setValue({ name: category.name, description: category.description ?? '' });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const request = this.form.getRawValue();
    const id = this.editingId();

    const operation = id ? this.categoryService.update(id, request) : this.categoryService.create(request);

    operation.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
