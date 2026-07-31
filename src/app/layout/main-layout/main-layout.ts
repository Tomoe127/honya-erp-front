import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen">
      <mat-sidenav mode="side" opened class="w-64">
        <div class="px-4 py-4 text-lg font-semibold">Honya ERP</div>
        <mat-nav-list>
          @for (item of navItems; track item.path) {
            <a mat-list-item [routerLink]="item.path" routerLinkActive="bg-black/5">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>Honya ERP</span>
        </mat-toolbar>
        <div class="p-6">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class MainLayout {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Libros', icon: 'menu_book', path: '/books' },
    { label: 'Inventario', icon: 'inventory_2', path: '/inventory' },
    { label: 'Compras', icon: 'shopping_cart', path: '/purchases' },
    { label: 'Ventas', icon: 'point_of_sale', path: '/sales' },
    { label: 'Reportes', icon: 'bar_chart', path: '/reports' },
    { label: 'Usuarios', icon: 'group', path: '/users' },
  ];
}
