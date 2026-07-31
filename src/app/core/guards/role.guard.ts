import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const requiredRoles = (route.data['roles'] as string[] | undefined) ?? [];
  const hasAccess = requiredRoles.length === 0 || requiredRoles.some((role) => authStore.hasRole(role));

  return hasAccess ? true : router.createUrlTree(['/dashboard']);
};
