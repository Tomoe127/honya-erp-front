import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <h1 class="font-serif text-2xl font-semibold tracking-tight text-ink mb-1">Dashboard</h1>
    <p class="text-sm text-ink-muted mb-6">Resumen del día para tu librería.</p>

    <div class="rounded-lg border border-line bg-paper px-8 py-12 flex flex-col items-center text-center gap-3">
      <span class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
        <mat-icon class="text-brand!">bar_chart</mat-icon>
      </span>
      <p class="text-sm font-medium text-ink">Los indicadores llegan en la Fase 6</p>
      <p class="text-sm text-ink-muted max-w-sm">
        Total de libros, stock disponible, productos con bajo stock y ventas del día se mostrarán aquí.
      </p>
    </div>
  `,
})
export class Dashboard {}
