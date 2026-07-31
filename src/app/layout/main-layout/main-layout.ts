import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatMenuModule],
  template: `
    <div class="flex h-screen bg-parchment text-ink">
      <aside class="w-64 shrink-0 border-r border-line flex flex-col">
        <div class="h-16 flex items-center gap-2 px-5">
          <mat-icon class="text-brand! text-[22px]! w-[22px]! h-[22px]!">auto_stories</mat-icon>
          <span class="font-serif text-lg font-semibold tracking-tight">Honya</span>
        </div>

        <nav class="flex-1 px-3 py-2 flex flex-col gap-0.5">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive
              #rla="routerLinkActive"
              [class]="navClass(rla.isActive)"
            >
              <mat-icon class="text-[20px]! w-[20px]! h-[20px]!">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="px-5 py-4 text-xs text-ink-muted border-t border-line">
          Honya ERP · Librería
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 shrink-0 flex items-center justify-end gap-3 px-6 border-b border-line">
          @if (currentUser(); as user) {
            <button
              class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-black/[0.03] transition-colors"
              [matMenuTriggerFor]="userMenu"
              type="button"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand text-xs font-semibold"
              >
                {{ initials() }}
              </span>
              <span class="text-sm font-medium text-ink-soft">{{ user.fullName }}</span>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Cerrar sesión</span>
              </button>
            </mat-menu>
          }
        </header>

        <main class="flex-1 overflow-auto px-8 py-7">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayout {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authStore.currentUser;

  protected readonly initials = computed(() => {
    const name = this.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Libros', icon: 'menu_book', path: '/books' },
    { label: 'Inventario', icon: 'inventory_2', path: '/inventory' },
    { label: 'Compras', icon: 'shopping_cart', path: '/purchases' },
    { label: 'Ventas', icon: 'point_of_sale', path: '/sales' },
    { label: 'Reportes', icon: 'bar_chart', path: '/reports' },
    { label: 'Usuarios', icon: 'group', path: '/users' },
  ];

  protected navClass(active: boolean): string {
    const base =
      'flex items-center gap-3 rounded-md pl-3 pr-3 py-2 text-sm font-medium border-l-[3px] transition-colors';
    return active
      ? `${base} border-brand bg-brand-soft text-brand`
      : `${base} border-transparent text-ink-soft hover:bg-black/[0.03] hover:text-ink`;
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
