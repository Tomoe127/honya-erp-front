import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Book } from '../books/data/book.model';
import { BookService } from '../books/data/book.service';
import { MovementFormDialog } from './movement-form-dialog/movement-form-dialog';
import { Movement, MovementType } from './data/movement.model';
import { MovementService } from './data/movement.service';
import { Stock } from './data/stock.model';
import { StockService } from './data/stock.service';

type InventoryTab = 'stock' | 'movements';

const ALL_BOOKS = 0;
const ALL_TYPES = '';

@Component({
  selector: 'app-inventory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Inventario</h1>
    <p class="text-sm text-ink-muted mb-6">Stock disponible y movimientos de almacén.</p>

    <nav class="mb-6 border-b border-line flex gap-1">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        [class.border-brand]="activeTab() === 'stock'"
        [class.text-brand]="activeTab() === 'stock'"
        [class.border-transparent]="activeTab() !== 'stock'"
        [class.text-ink-muted]="activeTab() !== 'stock'"
        (click)="selectTab('stock')"
      >
        Stock
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        [class.border-brand]="activeTab() === 'movements'"
        [class.text-brand]="activeTab() === 'movements'"
        [class.border-transparent]="activeTab() !== 'movements'"
        [class.text-ink-muted]="activeTab() !== 'movements'"
        (click)="selectTab('movements')"
      >
        Movimientos
      </button>
    </nav>

    @if (errorMessage()) {
      <p class="text-sm text-danger mb-4">{{ errorMessage() }}</p>
    }

    @if (activeTab() === 'stock') {
      <div class="rounded-lg border border-line bg-paper p-5 mb-6">
        <div class="flex flex-wrap gap-3 items-center">
          <mat-checkbox [checked]="lowStockOnly()" (change)="onLowStockToggle($event.checked)">
            Solo bajo stock
          </mat-checkbox>
        </div>
      </div>

      @if (editingStockId(); as bookId) {
        <div class="rounded-lg border border-line bg-paper p-5 mb-6 spine">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">Editar umbral mínimo</h2>
          <form [formGroup]="minStockForm" (ngSubmit)="submitMinStock(bookId)" class="flex flex-wrap gap-3 items-end">
            <div class="flex flex-col gap-1.5">
              <label for="min-stock" class="field-label">Stock mínimo</label>
              <input id="min-stock" type="number" min="0" formControlName="minStock" class="field w-32" />
            </div>
            <div class="flex gap-2">
              <button
                mat-flat-button
                type="submit"
                style="background-color: var(--color-brand); color: white;"
                [disabled]="minStockForm.invalid"
              >
                Guardar
              </button>
              <button mat-button type="button" (click)="cancelMinStockEdit()">Cancelar</button>
            </div>
          </form>
        </div>
      }

      <div class="rounded-lg border border-line bg-paper overflow-hidden">
        <table mat-table [dataSource]="stockRows()" class="w-full">
          <ng-container matColumnDef="isbn">
            <th mat-header-cell *matHeaderCellDef>ISBN</th>
            <td mat-cell *matCellDef="let row" class="tabular text-ink-muted">{{ row.bookIsbn }}</td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let row" class="font-medium">{{ row.bookTitle }}</td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Cantidad</th>
            <td mat-cell *matCellDef="let row" class="tabular">{{ row.quantity }}</td>
          </ng-container>

          <ng-container matColumnDef="minStock">
            <th mat-header-cell *matHeaderCellDef>Mínimo</th>
            <td mat-cell *matCellDef="let row" class="tabular">{{ row.minStock }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let row">
              @if (row.lowStock) {
                <span
                  class="inline-flex items-center rounded-full bg-danger-soft text-danger text-xs font-medium px-2.5 py-1"
                >
                  Bajo stock
                </span>
              } @else {
                <span
                  class="inline-flex items-center rounded-full bg-success-soft text-success text-xs font-medium px-2.5 py-1"
                >
                  Normal
                </span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right whitespace-nowrap">
              <button
                type="button"
                class="text-sm font-medium text-brand hover:underline"
                (click)="startEditMinStock(row)"
              >
                Editar mínimo
              </button>
              <button
                type="button"
                class="text-sm font-medium text-ink-soft hover:underline ml-3"
                (click)="openMovementDialog(row.bookId)"
              >
                Ajustar
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="stockColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: stockColumns"></tr>
        </table>

        <mat-paginator
          [length]="stockTotal()"
          [pageSize]="stockPageSize()"
          [pageIndex]="stockPageIndex()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onStockPageChange($event)"
        />
      </div>
    } @else {
      <div class="rounded-lg border border-line bg-paper p-5 mb-6">
        <form [formGroup]="movementFilterForm" class="flex flex-wrap gap-3 items-end">
          <div class="flex flex-col gap-1.5 min-w-[220px]">
            <label class="field-label">Libro</label>
            <mat-form-field appearance="outline" class="field-select">
              <mat-select formControlName="bookId">
                <mat-option [value]="allBooks">Todos</mat-option>
                @for (book of books(); track book.id) {
                  <mat-option [value]="book.id">{{ book.isbn }} — {{ book.title }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex flex-col gap-1.5 min-w-[160px]">
            <label class="field-label">Tipo</label>
            <mat-form-field appearance="outline" class="field-select">
              <mat-select formControlName="type">
                <mat-option [value]="allTypes">Todos</mat-option>
                <mat-option value="ENTRADA">Entrada</mat-option>
                <mat-option value="SALIDA">Salida</mat-option>
                <mat-option value="AJUSTE">Ajuste</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="mv-from" class="field-label">Desde</label>
            <input id="mv-from" type="date" formControlName="from" class="field" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="mv-to" class="field-label">Hasta</label>
            <input id="mv-to" type="date" formControlName="to" class="field" />
          </div>

          <button mat-button type="button" (click)="resetMovementFilters()">Limpiar</button>
          <span class="flex-1"></span>
          <button
            mat-flat-button
            type="button"
            style="background-color: var(--color-brand); color: white;"
            (click)="openMovementDialog(null)"
          >
            Nuevo movimiento
          </button>
        </form>
      </div>

      <div class="rounded-lg border border-line bg-paper overflow-hidden">
        <table mat-table [dataSource]="movements()" class="w-full">
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let mv" class="tabular text-ink-muted">
              {{ mv.createdAt | date: 'dd/MM/yyyy HH:mm' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="book">
            <th mat-header-cell *matHeaderCellDef>Libro</th>
            <td mat-cell *matCellDef="let mv" class="font-medium">{{ mv.bookTitle }}</td>
          </ng-container>

          <ng-container matColumnDef="movementType">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let mv">{{ movementTypeLabel(mv.movementType) }}</td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Cantidad</th>
            <td mat-cell *matCellDef="let mv" class="tabular">{{ mv.quantity }}</td>
          </ng-container>

          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Motivo</th>
            <td mat-cell *matCellDef="let mv">{{ mv.reason }}</td>
          </ng-container>

          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let mv" class="text-ink-muted">
              {{ referenceLabel(mv) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="createdBy">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let mv" class="text-ink-muted">{{ mv.createdBy }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="movementColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: movementColumns"></tr>
        </table>

        <mat-paginator
          [length]="movementsTotal()"
          [pageSize]="movementsPageSize()"
          [pageIndex]="movementsPageIndex()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onMovementsPageChange($event)"
        />
      </div>
    }
  `,
})
export class Inventory {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly stockService = inject(StockService);
  private readonly movementService = inject(MovementService);
  private readonly bookService = inject(BookService);

  protected readonly allBooks = ALL_BOOKS;
  protected readonly allTypes = ALL_TYPES;

  protected readonly activeTab = signal<InventoryTab>('stock');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly books = signal<Book[]>([]);

  protected readonly stockColumns = ['isbn', 'title', 'quantity', 'minStock', 'status', 'actions'];
  protected readonly stockRows = signal<Stock[]>([]);
  protected readonly stockTotal = signal(0);
  protected readonly stockPageIndex = signal(0);
  protected readonly stockPageSize = signal(10);
  protected readonly lowStockOnly = signal(false);
  protected readonly editingStockId = signal<number | null>(null);

  protected readonly minStockForm = this.fb.nonNullable.group({
    minStock: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly movementColumns = [
    'createdAt',
    'book',
    'movementType',
    'quantity',
    'reason',
    'reference',
    'createdBy',
  ];
  protected readonly movements = signal<Movement[]>([]);
  protected readonly movementsTotal = signal(0);
  protected readonly movementsPageIndex = signal(0);
  protected readonly movementsPageSize = signal(10);

  protected readonly movementFilterForm = this.fb.nonNullable.group({
    bookId: [ALL_BOOKS],
    type: [ALL_TYPES as MovementType | typeof ALL_TYPES],
    from: [''],
    to: [''],
  });

  constructor() {
    this.loadBooks();
    this.loadStock();
    this.loadMovements();
    this.movementFilterForm.valueChanges.subscribe(() => {
      this.movementsPageIndex.set(0);
      this.loadMovements();
    });
  }

  private loadBooks(): void {
    this.bookService.search({}, 0, 200).subscribe((response) => {
      if (response.data) {
        this.books.set(response.data.content);
      }
    });
  }

  private loadStock(): void {
    this.stockService.list(this.lowStockOnly(), this.stockPageIndex(), this.stockPageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.stockRows.set(page.content);
          this.stockTotal.set(page.totalElements);
        }
      },
    });
  }

  private loadMovements(): void {
    const filters = this.movementFilterForm.getRawValue();
    this.movementService
      .list(
        {
          bookId: filters.bookId || undefined,
          type: filters.type || undefined,
          from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined,
          to: filters.to ? new Date(`${filters.to}T23:59:59`).toISOString() : undefined,
        },
        this.movementsPageIndex(),
        this.movementsPageSize(),
      )
      .subscribe({
        next: (response) => {
          const page = response.data;
          if (page) {
            this.movements.set(page.content);
            this.movementsTotal.set(page.totalElements);
          }
        },
      });
  }

  protected selectTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
    if (tab === 'stock') {
      this.loadStock();
    }
  }

  protected onLowStockToggle(checked: boolean): void {
    this.lowStockOnly.set(checked);
    this.stockPageIndex.set(0);
    this.loadStock();
  }

  protected onStockPageChange(event: PageEvent): void {
    this.stockPageIndex.set(event.pageIndex);
    this.stockPageSize.set(event.pageSize);
    this.loadStock();
  }

  protected onMovementsPageChange(event: PageEvent): void {
    this.movementsPageIndex.set(event.pageIndex);
    this.movementsPageSize.set(event.pageSize);
    this.loadMovements();
  }

  protected resetMovementFilters(): void {
    this.movementFilterForm.reset({ bookId: ALL_BOOKS, type: ALL_TYPES, from: '', to: '' });
  }

  protected startEditMinStock(row: Stock): void {
    this.editingStockId.set(row.bookId);
    this.minStockForm.setValue({ minStock: row.minStock });
  }

  protected cancelMinStockEdit(): void {
    this.editingStockId.set(null);
  }

  protected submitMinStock(bookId: number): void {
    if (this.minStockForm.invalid) {
      return;
    }
    this.errorMessage.set(null);
    this.stockService.updateMinStock(bookId, this.minStockForm.getRawValue()).subscribe({
      next: () => {
        this.editingStockId.set(null);
        this.loadStock();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  protected openMovementDialog(bookId: number | null): void {
    const dialogRef = this.dialog.open(MovementFormDialog, {
      width: '520px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { bookId, books: this.books() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMovements();
        this.loadStock();
      }
    });
  }

  protected movementTypeLabel(type: MovementType): string {
    switch (type) {
      case 'ENTRADA':
        return 'Entrada';
      case 'SALIDA':
        return 'Salida';
      case 'AJUSTE':
        return 'Ajuste';
    }
  }

  protected referenceLabel(mv: Movement): string {
    switch (mv.referenceType) {
      case 'PURCHASE':
        return `Compra #${mv.referenceId}`;
      case 'SALE':
        return `Venta #${mv.referenceId}`;
      case 'MANUAL':
        return 'Manual';
    }
  }
}
