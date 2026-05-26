import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout';
import { AuthLayout } from './auth/shared/auth-layout/auth-layout';
import { authGuard, guestGuard } from './auth/guards/auth-guard';
import { AuthService } from './auth/services/auth';
import { filter, take, map } from 'rxjs';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
        canActivate: [() => {
          const auth = inject(AuthService);
          const router = inject(Router);

          if (auth.isLoggedIn()) {
            return router.createUrlTree(['/user-dashboard']);
          }

          return auth.authReady$.pipe(
            filter(value => value !== undefined),
            take(1),
            map(user => {
              if (user) return router.createUrlTree(['/user-dashboard']);
              return true;
            })
          );
        }],
      },
      {
        path: 'home',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'course/:slug',
        loadComponent: () =>
          import('./pages/course-details/course-details').then(m => m.CourseDetails),
      },
      {
        path: 'explore',
        loadComponent: () => import('./pages/explore/explore').then(m => m.Explore),
      },
      {
        path: 'explore/packages/:slug',
        loadComponent: () => import('./pages/package-details/package-details').then(m => m.PackageDetails),
      },
    ],
  },

  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./auth/login/login').then(m => m.Login),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./auth/register/register').then(m => m.Register),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./auth/forget-pass/forget-pass').then(m => m.ForgetPass),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./auth/reset-pass/reset-pass').then(m => m.ResetPass),
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./auth/verify-email/verify-email').then(m => m.VerifyEmail),
      },
    ],
  },

  {
    path: 'user-dashboard',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/user-dashboard/user-dashboard').then(m => m.UserDashboard)
      }
    ]
  },
  {
    path: 'my-courses',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./user-features/pages/my-courses/my-courses').then(m => m.MyCourses)
      }
    ]
  },
  {
    path: 'CourseWorkspace/:slug',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./user-features/pages/course-workspace/course-workspace')
            .then(m => m.CourseWorkspace),
        children: [
          {
            path: '',
            redirectTo: 'videos',
            pathMatch: 'full'
          },
          {
            path: 'materials',
            loadComponent: () =>
              import('./user-features/pages/course-workspace/components/tab-materials/tab-materials')
                .then(m => m.TabMaterials),
          },
          {
            path: 'videos',
            loadComponent: () =>
              import('./user-features/pages/course-workspace/components/tab-videos/tab-videos')
                .then(m => m.TabVideos),
          },
          {
            path: 'quiz',
            loadComponent: () =>
              import('./user-features/pages/course-workspace/components/tab-quiz/tab-quiz')
                .then(m => m.TabQuiz),
          }
        ]
      }
    ]
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'explore',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/explore/explore').then(m => m.Explore)
      },
      {
        path: 'packages/:slug',
        loadComponent: () =>
          import('./pages/package-details/package-details').then(m => m.PackageDetails)
      }
    ]
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home)
  },

  { path: '**', redirectTo: '' },
];