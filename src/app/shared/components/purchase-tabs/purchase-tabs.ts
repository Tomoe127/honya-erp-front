import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

interface PurchaseTab {
  label: string;
  path: string;
}

@Component({
  selector: 'app-purchase-tabs',
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
export class PurchaseTabs {
  protected readonly tabs: PurchaseTab[] = [
    { label: 'Compras', path: '/purchases' },
    { label: 'Proveedores', path: '/purchases/suppliers' },
  ];
}
