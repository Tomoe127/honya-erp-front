import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { Book, BookStatus } from './data/book.model';
import { BookService } from './data/book.service';

@Component({
  selector: 'app-books',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    CatalogTabs,
  ],
  template: `
    <app-catalog-tabs />

    <form [formGroup]="filterForm" class="flex flex-wrap gap-2 items-start mb-4">
      <mat-form-field appearance="outline">
        <mat-label>Buscar</mat-label>
        <input matInput formControlName="q" placeholder="Título o ISBN" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Categoría</mat-label>
        <mat-select formControlName="categoryId">
          <mat-option [value]="null">Todas</mat-option>
          @for (category of categories(); track category.id) {
            <mat-option [value]="category.id">{{ category.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select formControlName="status">
          <mat-option [value]="null">Todos</mat-option>
          <mat-option value="ACTIVE">Activo</mat-option>
          <mat-option value="INACTIVE">Inactivo</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-button type="button" (click)="resetFilters()">Limpiar filtros</button>
      <span class="flex-1"></span>
      <button mat-flat-button color="primary" type="button" (click)="startCreate()">Nuevo libro</button>
    </form>

    @if (showForm()) {
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-2 gap-2 mb-4 p-4 border rounded">
        <mat-form-field appearance="outline">
          <mat-label>ISBN</mat-label>
          <input matInput formControlName="isbn" [readonly]="!!editingId()" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Descripción</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Precio</mat-label>
          <input matInput type="number" step="0.01" formControlName="price" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Precio de costo</mat-label>
          <input matInput type="number" step="0.01" formControlName="costPrice" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <mat-select formControlName="categoryId">
            @for (category of categories(); track category.id) {
              <mat-option [value]="category.id">{{ category.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Editorial</mat-label>
          <mat-select formControlName="publisherId">
            <mat-option [value]="null">Sin editorial</mat-option>
            @for (publisher of publishers(); track publisher.id) {
              <mat-option [value]="publisher.id">{{ publisher.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Autores</mat-label>
          <mat-select formControlName="authorIds" multiple>
            @for (author of authors(); track author.id) {
              <mat-option [value]="author.id">{{ author.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="col-span-2 flex gap-2">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
            {{ editingId() ? 'Actualizar' : 'Crear' }}
          </button>
          <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
        </div>
      </form>
    }

    @if (errorMessage()) {
      <p class="text-red-600 text-sm mb-2">{{ errorMessage() }}</p>
    }

    <table mat-table [dataSource]="books()" class="w-full">
      <ng-container matColumnDef="isbn">
        <th mat-header-cell *matHeaderCellDef>ISBN</th>
        <td mat-cell *matCellDef="let book">{{ book.isbn }}</td>
      </ng-container>

      <ng-container matColumnDef="title">
        <th mat-header-cell *matHeaderCellDef>Título</th>
        <td mat-cell *matCellDef="let book">{{ book.title }}</td>
      </ng-container>

      <ng-container matColumnDef="categoryName">
        <th mat-header-cell *matHeaderCellDef>Categoría</th>
        <td mat-cell *matCellDef="let book">{{ book.categoryName }}</td>
      </ng-container>

      <ng-container matColumnDef="price">
        <th mat-header-cell *matHeaderCellDef>Precio</th>
        <td mat-cell *matCellDef="let book">{{ book.price }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let book">{{ book.status === 'ACTIVE' ? 'Activo' : 'Inactivo' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let book">
          <button mat-button (click)="edit(book)">Editar</button>
          <button mat-button (click)="toggleStatus(book)">
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
  `,
})
export class Books {
  private readonly fb = inject(FormBuilder);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly publisherService = inject(PublisherService);
  private readonly authorService = inject(AuthorService);

  protected readonly columns = ['isbn', 'title', 'categoryName', 'price', 'status', 'actions'];
  protected readonly books = signal<Book[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly publishers = signal<Publisher[]>([]);
  protected readonly authors = signal<Author[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly editingId = signal<number | null>(null);
  protected readonly showForm = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly filterForm = this.fb.nonNullable.group({
    q: [''],
    categoryId: [null as number | null],
    status: [null as BookStatus | null],
  });

  protected readonly form = this.fb.nonNullable.group({
    isbn: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    costPrice: [null as number | null],
    categoryId: [null as number | null, Validators.required],
    publisherId: [null as number | null],
    authorIds: [[] as number[]],
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
          categoryId: filters.categoryId ?? undefined,
          status: filters.status ?? undefined,
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
    this.filterForm.reset({ q: '', categoryId: null, status: null });
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      isbn: '',
      title: '',
      description: '',
      price: 0,
      costPrice: null,
      categoryId: null,
      publisherId: null,
      authorIds: [],
    });
    this.showForm.set(true);
  }

  protected edit(book: Book): void {
    this.editingId.set(book.id);
    this.form.setValue({
      isbn: book.isbn,
      title: book.title,
      description: book.description ?? '',
      price: book.price,
      costPrice: book.costPrice,
      categoryId: book.categoryId,
      publisherId: book.publisherId,
      authorIds: book.authors.map((author) => author.id),
    });
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  protected toggleStatus(book: Book): void {
    const nextStatus: BookStatus = book.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.bookService.updateStatus(book.id, nextStatus).subscribe({
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
      ? this.bookService.update(id, {
          title: value.title,
          description: value.description,
          price: value.price,
          costPrice: value.costPrice,
          categoryId: value.categoryId!,
          publisherId: value.publisherId,
          authorIds: value.authorIds,
        })
      : this.bookService.create({
          isbn: value.isbn,
          title: value.title,
          description: value.description,
          price: value.price,
          costPrice: value.costPrice,
          categoryId: value.categoryId!,
          publisherId: value.publisherId,
          authorIds: value.authorIds,
        });

    operation.subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
