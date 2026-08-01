import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

interface SaleTab {
  label: string;
  path: string;
}

@Component({
  selector: 'app-sale-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatTabsModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" class="mb-6 border-b border-line" [disableRipple]="true">
      @for (tab of tabs; track tab.path) {
        <a
          mat-tab-link
          [routerLink]="tab.path"
          routerLinkActive
          [routerLinkActiveOptions]="{ exact: true }"
          #rla="routerLinkActive"
          [active]="rla.isActive"
        >
          {{ tab.label }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #panel />
  `,
})
export class SaleTabs {
  protected readonly tabs: SaleTab[] = [
    { label: 'Ventas', path: '/sales' },
    { label: 'Clientes', path: '/sales/customers' },
  ];
}
