import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Book } from '../books/data/book.model';
import { BookService } from '../books/data/book.service';
import { AuthStore } from '../../core/auth/auth.store';
import { Customer } from '../customers/data/customer.model';
import { CustomerService } from '../customers/data/customer.service';
import { SaleTabs } from '../../shared/components/sale-tabs/sale-tabs';
import { SaleFormDialog } from './sale-form-dialog/sale-form-dialog';
import { PaymentMethod, Sale } from './data/sale.model';
import { SaleService } from './data/sale.service';

@Component({
  selector: 'app-sales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatPaginatorModule, MatTableModule, SaleTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Ventas</h1>
    <p class="text-sm text-ink-muted mb-6">Registro de ventas; valida stock y decrementa inventario.</p>

    <app-sale-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Ventas registradas</span>
        @if (authStore.hasAnyRole('ADMIN', 'VENDEDOR')) {
          <button
            mat-flat-button
            type="button"
            style="background-color: var(--color-brand); color: white;"
            (click)="openCreateDialog()"
          >
            Nueva venta
          </button>
        }
      </div>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </div>

    @if (expandedSale(); as sale) {
      <div class="rounded-lg border border-line bg-paper p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Detalle venta #{{ sale.id }} — {{ sale.customerName ?? 'Cliente genérico' }}
          </h2>
          <button mat-button type="button" (click)="expandedSale.set(null)">Cerrar</button>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-muted border-b border-line">
              <th class="py-1.5">ISBN</th>
              <th class="py-1.5">Título</th>
              <th class="py-1.5">Cantidad</th>
              <th class="py-1.5">Precio unitario</th>
              <th class="py-1.5">Descuento</th>
              <th class="py-1.5">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (detail of sale.details; track detail.bookId) {
              <tr class="border-b border-line last:border-0">
                <td class="py-1.5 tabular text-ink-muted">{{ detail.bookIsbn }}</td>
                <td class="py-1.5 font-medium">{{ detail.bookTitle }}</td>
                <td class="py-1.5 tabular">{{ detail.quantity }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.unitPrice.toFixed(2) }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.discount.toFixed(2) }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.subtotal.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="sales()" class="w-full">
        <ng-container matColumnDef="saleDate">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let sale" class="tabular text-ink-muted">
            {{ sale.saleDate | date: 'dd/MM/yyyy HH:mm' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="customerName">
          <th mat-header-cell *matHeaderCellDef>Cliente</th>
          <td mat-cell *matCellDef="let sale" class="font-medium">{{ sale.customerName ?? 'Cliente genérico' }}</td>
        </ng-container>

        <ng-container matColumnDef="paymentMethod">
          <th mat-header-cell *matHeaderCellDef>Pago</th>
          <td mat-cell *matCellDef="let sale">{{ paymentMethodLabel(sale.paymentMethod) }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let sale" class="tabular">S/ {{ sale.total.toFixed(2) }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let sale">
            @if (sale.status === 'COMPLETED') {
              <span
                class="inline-flex items-center rounded-full bg-success-soft text-success text-xs font-medium px-2.5 py-1"
              >
                Completada
              </span>
            } @else {
              <span
                class="inline-flex items-center rounded-full bg-danger-soft text-danger text-xs font-medium px-2.5 py-1"
              >
                Cancelada
              </span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let sale" class="text-right whitespace-nowrap">
            <button
              type="button"
              class="text-sm font-medium text-brand hover:underline"
              (click)="expandedSale.set(sale)"
            >
              Ver detalle
            </button>
            @if (sale.status === 'COMPLETED' && authStore.hasAnyRole('ADMIN', 'VENDEDOR')) {
              <button
                type="button"
                class="text-sm font-medium text-danger hover:underline ml-3"
                (click)="cancelSale(sale)"
              >
                Cancelar
              </button>
            }
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
export class Sales {
  private readonly dialog = inject(MatDialog);
  protected readonly authStore = inject(AuthStore);
  private readonly saleService = inject(SaleService);
  private readonly customerService = inject(CustomerService);
  private readonly bookService = inject(BookService);

  protected readonly columns = ['saleDate', 'customerName', 'paymentMethod', 'total', 'status', 'actions'];
  protected readonly sales = signal<Sale[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly expandedSale = signal<Sale | null>(null);

  protected readonly books = signal<Book[]>([]);
  protected readonly activeCustomers = signal<Customer[]>([]);

  constructor() {
    this.loadOptions();
    this.load();
  }

  private loadOptions(): void {
    this.bookService.search({ status: 'ACTIVE' }, 0, 200).subscribe((response) => {
      if (response.data) {
        this.books.set(response.data.content);
      }
    });
    this.customerService.list(0, 200).subscribe((response) => {
      if (response.data) {
        this.activeCustomers.set(response.data.content.filter((customer) => customer.active));
      }
    });
  }

  private load(): void {
    this.saleService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.sales.set(page.content);
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

  protected openCreateDialog(): void {
    const dialogRef = this.dialog.open(SaleFormDialog, {
      width: '760px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { customers: this.activeCustomers(), books: this.books() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.pageIndex.set(0);
        this.load();
      }
    });
  }

  protected cancelSale(sale: Sale): void {
    this.saleService.cancel(sale.id).subscribe({
      next: () => {
        this.expandedSale.set(null);
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  protected paymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'CARD':
        return 'Tarjeta';
      case 'TRANSFER':
        return 'Transferencia';
      case 'DIGITAL_WALLET':
        return 'Billetera digital';
    }
  }
}
