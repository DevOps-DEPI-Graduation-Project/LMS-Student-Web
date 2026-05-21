import { Routes } from '@angular/router';
import { Layout } from './layout/layout';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile').then(m => m.Profile),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./pages/security/security').then(m => m.Security),
      },
    ],
  },
];