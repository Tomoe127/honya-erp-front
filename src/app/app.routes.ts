import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'books',
        loadComponent: () => import('./features/books/books').then((m) => m.Books),
      },
      {
        path: 'books/authors',
        loadComponent: () => import('./features/authors/authors').then((m) => m.Authors),
      },
      {
        path: 'books/categories',
        loadComponent: () => import('./features/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'books/publishers',
        loadComponent: () => import('./features/publishers/publishers').then((m) => m.Publishers),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: 'purchases',
        loadComponent: () => import('./features/purchases/purchases').then((m) => m.Purchases),
      },
      {
        path: 'purchases/suppliers',
        loadComponent: () => import('./features/suppliers/suppliers').then((m) => m.Suppliers),
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/sales').then((m) => m.Sales),
      },
      {
        path: 'sales/customers',
        loadComponent: () => import('./features/customers/customers').then((m) => m.Customers),
      },
    ],
  },
];
