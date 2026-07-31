import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

interface CatalogTab {
  label: string;
  path: string;
}

@Component({
  selector: 'app-catalog-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatTabsModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" class="mb-4">
      @for (tab of tabs; track tab.path) {
        <a
          mat-tab-link
          [routerLink]="tab.path"
          routerLinkActive
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
export class CatalogTabs {
  protected readonly tabs: CatalogTab[] = [
    { label: 'Libros', path: '/books' },
    { label: 'Autores', path: '/books/authors' },
    { label: 'Categorías', path: '/books/categories' },
    { label: 'Editoriales', path: '/books/publishers' },
  ];
}
