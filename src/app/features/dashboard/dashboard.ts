import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="text-gray-500">Los indicadores se implementan en la Fase 6 (Reportes).</p>
  `,
})
export class Dashboard {}
