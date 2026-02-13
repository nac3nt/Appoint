import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRole = route.data['role'] as string;
  if (requiredRole && !authService.hasRole(requiredRole)) {
    alert('Access denied. You do not have permission to view this page.');
    router.navigate(['/login']);
    return false;
  }

  return true;
};