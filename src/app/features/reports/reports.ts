import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Stock } from '../inventory/data/stock.model';
import { SalesByDate, TopSellingBook } from './data/report.model';
import { ReportService } from './data/report.service';

interface SalesBar extends SalesByDate {
  heightPercent: number;
}

interface TopBookBar extends TopSellingBook {
  widthPercent: number;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Reportes</h1>
    <p class="text-sm text-ink-muted mb-6">Ventas por fecha, libros más vendidos y bajo stock.</p>

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <form [formGroup]="filterForm" class="flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1.5">
          <label for="rep-from" class="field-label">Desde</label>
          <input id="rep-from" type="date" formControlName="from" class="field" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="rep-to" class="field-label">Hasta</label>
          <input id="rep-to" type="date" formControlName="to" class="field" />
        </div>
        <div class="flex flex-col gap-1.5 min-w-[160px]">
          <label class="field-label">Agrupar por</label>
          <mat-form-field appearance="outline" class="field-select">
            <mat-select formControlName="groupBy">
              <mat-option value="day">Día</mat-option>
              <mat-option value="month">Mes</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <button mat-button type="button" (click)="toggleTableView()">
          {{ showTable() ? 'Ver gráfico' : 'Ver tabla' }}
        </button>
      </form>
    </div>

    <div class="rounded-lg border border-line bg-paper p-5 mb-6">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-4">Ventas por fecha</h2>

      @if (salesBars().length === 0) {
        <p class="text-sm text-ink-muted py-8 text-center">Sin ventas completadas en el rango seleccionado.</p>
      } @else if (!showTable()) {
        <div class="flex items-end gap-2 h-48 border-b border-line pb-1">
          @for (bar of salesBars(); track bar.period) {
            <div
              class="flex-1 flex flex-col items-center justify-end h-full group relative"
              (mouseenter)="hoveredPeriod.set(bar.period)"
              (mouseleave)="hoveredPeriod.set(null)"
            >
              @if (hoveredPeriod() === bar.period) {
                <div
                  class="absolute bottom-full mb-2 rounded-md bg-ink text-parchment text-xs px-2.5 py-1.5 whitespace-nowrap z-10"
                >
                  <div class="font-medium">S/ {{ bar.total.toFixed(2) }}</div>
                  <div class="text-parchment/70">{{ bar.salesCount }} venta(s)</div>
                </div>
              }
              <div
                class="w-full rounded-t-sm transition-opacity"
                style="background-color: var(--color-brand);"
                [class.opacity-70]="hoveredPeriod() !== null && hoveredPeriod() !== bar.period"
                [style.height.%]="bar.heightPercent"
              ></div>
            </div>
          }
        </div>
        <div class="flex gap-2 mt-2">
          @for (bar of salesBars(); track bar.period) {
            <div class="flex-1 text-center text-[11px] text-ink-muted truncate">{{ bar.period }}</div>
          }
        </div>
      } @else {
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-muted border-b border-line">
              <th class="py-1.5">Periodo</th>
              <th class="py-1.5">Ventas</th>
              <th class="py-1.5">Total</th>
            </tr>
          </thead>
          <tbody>
            @for (bar of salesBars(); track bar.period) {
              <tr class="border-b border-line last:border-0">
                <td class="py-1.5">{{ bar.period }}</td>
                <td class="py-1.5 tabular">{{ bar.salesCount }}</td>
                <td class="py-1.5 tabular">S/ {{ bar.total.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="rounded-lg border border-line bg-paper p-5">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-4">Libros más vendidos</h2>
        @if (topBooks().length === 0) {
          <p class="text-sm text-ink-muted py-4 text-center">Sin datos en el rango seleccionado.</p>
        } @else {
          <div class="flex flex-col gap-3">
            @for (book of topBooks(); track book.bookId) {
              <div>
                <div class="flex items-baseline justify-between text-sm mb-1">
                  <span class="font-medium truncate pr-2">{{ book.bookTitle }}</span>
                  <span class="tabular text-ink-muted whitespace-nowrap">
                    {{ book.quantitySold }} und &middot; S/ {{ book.totalRevenue.toFixed(2) }}
                  </span>
                </div>
                <div class="h-2 rounded-full bg-black/5 overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    style="background-color: var(--color-brand);"
                    [style.width.%]="book.widthPercent"
                  ></div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="rounded-lg border border-line bg-paper p-5">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-4">Bajo stock</h2>
        @if (lowStock().length === 0) {
          <p class="text-sm text-ink-muted py-4 text-center">No hay libros con bajo stock.</p>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-ink-muted border-b border-line">
                <th class="py-1.5">Título</th>
                <th class="py-1.5">Cantidad</th>
                <th class="py-1.5">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              @for (stock of lowStock(); track stock.bookId) {
                <tr class="border-b border-line last:border-0">
                  <td class="py-1.5 font-medium">{{ stock.bookTitle }}</td>
                  <td class="py-1.5 tabular text-danger">{{ stock.quantity }}</td>
                  <td class="py-1.5 tabular">{{ stock.minStock }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class Reports {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);

  protected readonly showTable = signal(false);
  protected readonly hoveredPeriod = signal<string | null>(null);

  private readonly salesByDate = signal<SalesByDate[]>([]);
  protected readonly topBooks = signal<TopBookBar[]>([]);
  protected readonly lowStock = signal<Stock[]>([]);

  protected readonly salesBars = computed<SalesBar[]>(() => {
    const rows = this.salesByDate();
    const max = Math.max(...rows.map((row) => row.total), 1);
    return rows.map((row) => ({ ...row, heightPercent: Math.max((row.total / max) * 100, 2) }));
  });

  protected readonly filterForm = this.fb.nonNullable.group({
    from: toIsoDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
    to: toIsoDate(new Date()),
    groupBy: 'day' as 'day' | 'month',
  });

  constructor() {
    this.load();
    this.loadLowStock();
    this.filterForm.valueChanges.subscribe(() => this.load());
  }

  protected toggleTableView(): void {
    this.showTable.update((value) => !value);
  }

  private load(): void {
    const { from, to, groupBy } = this.filterForm.getRawValue();
    this.reportService.getSalesByDate(from, to, groupBy).subscribe((response) => {
      if (response.data) {
        this.salesByDate.set(response.data);
      }
    });

    this.reportService.getTopSellingBooks(from, to, 8).subscribe((response) => {
      const rows = response.data ?? [];
      const max = Math.max(...rows.map((row) => row.quantitySold), 1);
      this.topBooks.set(rows.map((row) => ({ ...row, widthPercent: Math.max((row.quantitySold / max) * 100, 4) })));
    });
  }

  private loadLowStock(): void {
    this.reportService.getLowStock(0, 50).subscribe((response) => {
      if (response.data) {
        this.lowStock.set(response.data.content);
      }
    });
  }
}
