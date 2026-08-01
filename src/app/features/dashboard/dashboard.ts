import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ReportService } from '../reports/data/report.service';

interface Kpi {
  label: string;
  value: string;
  icon: string;
  tone: 'default' | 'danger';
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Dashboard</h1>
    <p class="text-sm text-ink-muted mb-6">Resumen del día para tu librería.</p>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      @for (kpi of kpis(); track kpi.label) {
        <div class="rounded-lg border border-line bg-paper p-5">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full"
              [class.bg-brand-soft]="kpi.tone === 'default'"
              [class.bg-danger-soft]="kpi.tone === 'danger'"
            >
              <mat-icon
                class="text-[18px]! w-[18px]! h-[18px]!"
                [class.text-brand!]="kpi.tone === 'default'"
                [class.text-danger!]="kpi.tone === 'danger'"
              >
                {{ kpi.icon }}
              </mat-icon>
            </span>
            <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">{{ kpi.label }}</span>
          </div>
          <p class="text-2xl font-serif font-semibold tabular" [class.text-danger]="kpi.tone === 'danger'">
            {{ kpi.value }}
          </p>
        </div>
      }
    </div>
  `,
})
export class Dashboard {
  private readonly reportService = inject(ReportService);

  protected readonly kpis = signal<Kpi[]>([]);

  constructor() {
    this.reportService.getDashboard().subscribe((response) => {
      const summary = response.data;
      if (!summary) {
        return;
      }
      this.kpis.set([
        { label: 'Libros activos', value: `${summary.totalBooks}`, icon: 'menu_book', tone: 'default' },
        { label: 'Stock disponible', value: `${summary.stockAvailable}`, icon: 'inventory_2', tone: 'default' },
        {
          label: 'Bajo stock',
          value: `${summary.lowStockCount}`,
          icon: 'warning',
          tone: summary.lowStockCount > 0 ? 'danger' : 'default',
        },
        {
          label: 'Ventas de hoy',
          value: `S/ ${summary.salesToday.toFixed(2)}`,
          icon: 'point_of_sale',
          tone: 'default',
        },
        {
          label: 'Ventas del mes',
          value: `S/ ${summary.salesThisMonth.toFixed(2)}`,
          icon: 'bar_chart',
          tone: 'default',
        },
      ]);
    });
  }
}
