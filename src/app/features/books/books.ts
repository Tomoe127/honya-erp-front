import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CatalogTabs } from '../../shared/components/catalog-tabs/catalog-tabs';
import { Author } from '../authors/data/author.model';
import { AuthorService } from '../authors/data/author.service';
import { Category } from '../categories/data/category.model';
import { CategoryService } from '../categories/data/category.service';
import { Publisher } from '../publishers/data/publisher.model';
import { PublisherService } from '../publishers/data/publisher.service';
import { BookFormDialog } from './book-form-dialog/book-form-dialog';
import { Book, BookStatus } from './data/book.model';
import { BookService } from './data/book.service';

const ALL_CATEGORIES = 0;
const ALL_STATUSES = '';

@Component({
  selector: 'app-books',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    CatalogTabs,
  ],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Libros</h1>
    <p class="text-sm text-ink-muted mb-6">Catálogo de libros de la librería.</p>

    <app-catalog-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <form [formGroup]="filterForm" class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1.5 min-w-[200px]">
          <label for="filter-q" class="field-label">Buscar</label>
          <input id="filter-q" formControlName="q" placeholder="Título o ISBN" class="field" />
        </div>

        <div class="flex flex-col gap-1.5 min-w-[180px]">
          <label class="field-label">Categoría</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="categoryId">
              <mat-option [value]="allCategories">Todas</mat-option>
              @for (category of categories(); track category.id) {
                <mat-option [value]="category.id">{{ category.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1.5 min-w-[160px]">
          <label class="field-label">Estado</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="status">
              <mat-option [value]="allStatuses">Todos</mat-option>
              <mat-option value="ACTIVE">Activo</mat-option>
              <mat-option value="INACTIVE">Inactivo</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <button mat-button type="button" (click)="resetFilters()">Limpiar</button>
        <span class="flex-1"></span>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          (click)="openCreateDialog()"
        >
          Nuevo libro
        </button>
      </form>
    </div>

    @if (errorMessage()) {
      <p class="text-sm text-danger mb-4">{{ errorMessage() }}</p>
    }

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="books()" class="w-full">
        <ng-container matColumnDef="isbn">
          <th mat-header-cell *matHeaderCellDef>ISBN</th>
          <td mat-cell *matCellDef="let book" class="tabular text-ink-muted">{{ book.isbn }}</td>
        </ng-container>

        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Título</th>
          <td mat-cell *matCellDef="let book" class="font-medium">{{ book.title }}</td>
        </ng-container>

        <ng-container matColumnDef="categoryName">
          <th mat-header-cell *matHeaderCellDef>Categoría</th>
          <td mat-cell *matCellDef="let book">{{ book.categoryName }}</td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Precio</th>
          <td mat-cell *matCellDef="let book" class="tabular">S/ {{ book.price.toFixed(2) }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let book">
            @if (book.status === 'ACTIVE') {
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
          <td mat-cell *matCellDef="let book" class="text-right whitespace-nowrap">
            <button type="button" class="text-sm font-medium text-brand hover:underline" (click)="openEditDialog(book)">
              Editar
            </button>
            <button
              type="button"
              class="text-sm font-medium text-ink-soft hover:underline ml-3"
              (click)="toggleStatus(book)"
            >
              {{ book.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}
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
export class Books {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly publisherService = inject(PublisherService);
  private readonly authorService = inject(AuthorService);

  protected readonly allCategories = ALL_CATEGORIES;
  protected readonly allStatuses = ALL_STATUSES;

  protected readonly columns = ['isbn', 'title', 'categoryName', 'price', 'status', 'actions'];
  protected readonly books = signal<Book[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly publishers = signal<Publisher[]>([]);
  protected readonly authors = signal<Author[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly filterForm = this.fb.nonNullable.group({
    q: [''],
    categoryId: [ALL_CATEGORIES],
    status: [ALL_STATUSES as BookStatus | typeof ALL_STATUSES],
  });

  constructor() {
    this.loadOptions();
    this.load();
    this.filterForm.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  private loadOptions(): void {
    this.categoryService.list(0, 100).subscribe((response) => {
      if (response.data) {
        this.categories.set(response.data.content);
      }
    });
    this.publisherService.list(0, 100).subscribe((response) => {
      if (response.data) {
        this.publishers.set(response.data.content);
      }
    });
    this.authorService.list(0, 100).subscribe((response) => {
      if (response.data) {
        this.authors.set(response.data.content);
      }
    });
  }

  private load(): void {
    const filters = this.filterForm.getRawValue();
    this.bookService
      .search(
        {
          q: filters.q || undefined,
          categoryId: filters.categoryId || undefined,
          status: filters.status || undefined,
        },
        this.pageIndex(),
        this.pageSize(),
      )
      .subscribe({
        next: (response) => {
          const page = response.data;
          if (page) {
            this.books.set(page.content);
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

  protected resetFilters(): void {
    this.filterForm.reset({ q: '', categoryId: ALL_CATEGORIES, status: ALL_STATUSES });
  }

  protected openCreateDialog(): void {
    const dialogRef = this.dialog.open(BookFormDialog, {
      width: '640px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { book: null, categories: this.categories(), publishers: this.publishers(), authors: this.authors() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  protected openEditDialog(book: Book): void {
    const dialogRef = this.dialog.open(BookFormDialog, {
      width: '640px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { book, categories: this.categories(), publishers: this.publishers(), authors: this.authors() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  protected toggleStatus(book: Book): void {
    const nextStatus: BookStatus = book.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.bookService.updateStatus(book.id, nextStatus).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
