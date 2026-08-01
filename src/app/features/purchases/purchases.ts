import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Book } from '../books/data/book.model';
import { BookService } from '../books/data/book.service';
import { Supplier } from '../suppliers/data/supplier.model';
import { SupplierService } from '../suppliers/data/supplier.service';
import { PurchaseTabs } from '../../shared/components/purchase-tabs/purchase-tabs';
import { PurchaseFormDialog } from './purchase-form-dialog/purchase-form-dialog';
import { Purchase } from './data/purchase.model';
import { PurchaseService } from './data/purchase.service';

@Component({
  selector: 'app-purchases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatPaginatorModule, MatTableModule, PurchaseTabs],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Compras</h1>
    <p class="text-sm text-ink-muted mb-6">Registro de compras a proveedores; confirma e incrementa stock.</p>

    <app-purchase-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Compras registradas</span>
        <button
          mat-flat-button
          type="button"
          style="background-color: var(--color-brand); color: white;"
          (click)="openCreateDialog()"
        >
          Nueva compra
        </button>
      </div>

      @if (errorMessage()) {
        <p class="text-sm text-danger mt-3">{{ errorMessage() }}</p>
      }
    </div>

    @if (expandedPurchase(); as purchase) {
      <div class="rounded-lg border border-line bg-paper p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Detalle compra #{{ purchase.id }} — {{ purchase.supplierName }}
          </h2>
          <button mat-button type="button" (click)="expandedPurchase.set(null)">Cerrar</button>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-muted border-b border-line">
              <th class="py-1.5">ISBN</th>
              <th class="py-1.5">Título</th>
              <th class="py-1.5">Cantidad</th>
              <th class="py-1.5">Costo unitario</th>
              <th class="py-1.5">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (detail of purchase.details; track detail.bookId) {
              <tr class="border-b border-line last:border-0">
                <td class="py-1.5 tabular text-ink-muted">{{ detail.bookIsbn }}</td>
                <td class="py-1.5 font-medium">{{ detail.bookTitle }}</td>
                <td class="py-1.5 tabular">{{ detail.quantity }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.unitCost.toFixed(2) }}</td>
                <td class="py-1.5 tabular">S/ {{ detail.subtotal.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <div class="rounded-lg border border-line bg-paper overflow-hidden">
      <table mat-table [dataSource]="purchases()" class="w-full">
        <ng-container matColumnDef="purchaseDate">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let purchase" class="tabular text-ink-muted">
            {{ purchase.purchaseDate | date: 'dd/MM/yyyy HH:mm' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="supplierName">
          <th mat-header-cell *matHeaderCellDef>Proveedor</th>
          <td mat-cell *matCellDef="let purchase" class="font-medium">{{ purchase.supplierName }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let purchase" class="tabular">S/ {{ purchase.total.toFixed(2) }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let purchase">
            @switch (purchase.status) {
              @case ('COMPLETED') {
                <span
                  class="inline-flex items-center rounded-full bg-success-soft text-success text-xs font-medium px-2.5 py-1"
                >
                  Completada
                </span>
              }
              @case ('CANCELLED') {
                <span
                  class="inline-flex items-center rounded-full bg-danger-soft text-danger text-xs font-medium px-2.5 py-1"
                >
                  Cancelada
                </span>
              }
              @default {
                <span
                  class="inline-flex items-center rounded-full bg-black/5 text-ink-soft text-xs font-medium px-2.5 py-1"
                >
                  Pendiente
                </span>
              }
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let purchase" class="text-right whitespace-nowrap">
            <button
              type="button"
              class="text-sm font-medium text-brand hover:underline"
              (click)="expandedPurchase.set(purchase)"
            >
              Ver detalle
            </button>
            @if (purchase.status === 'COMPLETED') {
              <button
                type="button"
                class="text-sm font-medium text-danger hover:underline ml-3"
                (click)="cancelPurchase(purchase)"
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
export class Purchases {
  private readonly dialog = inject(MatDialog);
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierService = inject(SupplierService);
  private readonly bookService = inject(BookService);

  protected readonly columns = ['purchaseDate', 'supplierName', 'total', 'status', 'actions'];
  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly expandedPurchase = signal<Purchase | null>(null);

  protected readonly books = signal<Book[]>([]);
  protected readonly activeSuppliers = signal<Supplier[]>([]);

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
    this.supplierService.list(0, 200).subscribe((response) => {
      if (response.data) {
        this.activeSuppliers.set(response.data.content.filter((supplier) => supplier.active));
      }
    });
  }

  private load(): void {
    this.purchaseService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        if (page) {
          this.purchases.set(page.content);
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
    const dialogRef = this.dialog.open(PurchaseFormDialog, {
      width: '720px',
      maxWidth: '90vw',
      panelClass: 'app-dialog',
      backdropClass: 'app-dialog-backdrop',
      data: { suppliers: this.activeSuppliers(), books: this.books() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.pageIndex.set(0);
        this.load();
      }
    });
  }

  protected cancelPurchase(purchase: Purchase): void {
    this.purchaseService.cancel(purchase.id).subscribe({
      next: () => {
        this.expandedPurchase.set(null);
        this.load();
      },
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }
}
