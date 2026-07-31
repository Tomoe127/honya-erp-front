import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Book } from '../books/data/book.model';
import { BookService } from '../books/data/book.service';
import { Supplier } from '../suppliers/data/supplier.model';
import { SupplierService } from '../suppliers/data/supplier.service';
import { PurchaseTabs } from '../../shared/components/purchase-tabs/purchase-tabs';
import { Purchase } from './data/purchase.model';
import { PurchaseService } from './data/purchase.service';

@Component({
  selector: 'app-purchases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTableModule,
    PurchaseTabs,
  ],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Compras</h1>
    <p class="text-sm text-ink-muted mb-6">Registro de compras a proveedores; confirma e incrementa stock.</p>

    <app-purchase-tabs />

    <div class="rounded-lg border border-line bg-paper p-5 mb-6" [class.spine]="showForm()">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Nueva compra</h2>
        @if (!showForm()) {
          <button
            mat-flat-button
            type="button"
            style="background-color: var(--color-brand); color: white;"
            (click)="startCreate()"
          >
            Nueva compra
          </button>
        }
      </div>

      @if (showForm()) {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="flex flex-col gap-1.5 mb-4 max-w-sm">
            <label class="field-label">Proveedor</label>
            <mat-form-field appearance="outline" class="field-select">
              <mat-select formControlName="supplierId">
                @for (supplier of activeSuppliers(); track supplier.id) {
                  <mat-option [value]="supplier.id">{{ supplier.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div formArrayName="details" class="flex flex-col gap-2">
            @for (group of detailsArray.controls; track $index) {
              <div [formGroupName]="$index" class="flex flex-wrap gap-3 items-end">
                <div class="flex flex-col gap-1.5 min-w-[240px] flex-1">
                  <label class="field-label">Libro</label>
                  <mat-form-field appearance="outline" class="field-select">
                    <mat-select formControlName="bookId">
                      @for (book of books(); track book.id) {
                        <mat-option [value]="book.id">{{ book.isbn }} — {{ book.title }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="field-label">Cantidad</label>
                  <input type="number" min="1" formControlName="quantity" class="field w-24" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="field-label">Costo unitario</label>
                  <input type="number" step="0.01" min="0" formControlName="unitCost" class="field w-32" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <span class="field-label">Subtotal</span>
                  <span class="tabular text-sm py-2">S/ {{ detailSubtotal($index).toFixed(2) }}</span>
                </div>

                <button
                  mat-button
                  type="button"
                  [disabled]="detailsArray.length === 1"
                  (click)="removeDetailRow($index)"
                >
                  Quitar
                </button>
              </div>
            }
          </div>

          <button mat-button type="button" class="mt-2" (click)="addDetailRow()">Agregar libro</button>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <span class="text-sm font-medium">Total: S/ {{ formTotal().toFixed(2) }}</span>
            <div class="flex gap-2">
              <button
                mat-flat-button
                type="submit"
                style="background-color: var(--color-brand); color: white;"
                [disabled]="form.invalid"
              >
                Registrar compra
              </button>
              <button mat-button type="button" (click)="cancelCreate()">Cancelar</button>
            </div>
          </div>
        </form>
      }

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
  private readonly fb = inject(FormBuilder);
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierService = inject(SupplierService);
  private readonly bookService = inject(BookService);

  protected readonly columns = ['purchaseDate', 'supplierName', 'total', 'status', 'actions'];
  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly showForm = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly expandedPurchase = signal<Purchase | null>(null);

  protected readonly books = signal<Book[]>([]);
  protected readonly activeSuppliers = signal<Supplier[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    supplierId: [null as number | null, Validators.required],
    details: this.fb.array([this.createDetailGroup()]),
  });

  protected get detailsArray(): FormArray {
    return this.form.get('details') as FormArray;
  }

  constructor() {
    this.loadOptions();
    this.load();
  }

  private createDetailGroup() {
    return this.fb.nonNullable.group({
      bookId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
    });
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

  protected detailSubtotal(index: number): number {
    const group = this.detailsArray.at(index);
    const quantity = Number(group.get('quantity')?.value ?? 0);
    const unitCost = Number(group.get('unitCost')?.value ?? 0);
    return quantity * unitCost;
  }

  protected formTotal(): number {
    return this.detailsArray.controls.reduce((sum, group) => {
      const quantity = Number(group.get('quantity')?.value ?? 0);
      const unitCost = Number(group.get('unitCost')?.value ?? 0);
      return sum + quantity * unitCost;
    }, 0);
  }

  protected addDetailRow(): void {
    this.detailsArray.push(this.createDetailGroup());
  }

  protected removeDetailRow(index: number): void {
    if (this.detailsArray.length > 1) {
      this.detailsArray.removeAt(index);
    }
  }

  protected startCreate(): void {
    this.errorMessage.set(null);
    this.form.reset({ supplierId: null });
    this.detailsArray.clear();
    this.detailsArray.push(this.createDetailGroup());
    this.showForm.set(true);
  }

  protected cancelCreate(): void {
    this.showForm.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const value = this.form.getRawValue();

    this.purchaseService
      .create({
        supplierId: value.supplierId!,
        details: value.details.map((detail) => ({
          bookId: detail.bookId!,
          quantity: detail.quantity,
          unitCost: detail.unitCost,
        })),
      })
      .subscribe({
        next: () => {
          this.showForm.set(false);
          this.pageIndex.set(0);
          this.load();
        },
        error: (error: Error) => this.errorMessage.set(error.message),
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
