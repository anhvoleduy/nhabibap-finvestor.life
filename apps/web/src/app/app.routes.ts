import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'boards', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(
        (m) => m.ShellComponent,
      ),
    children: [
      {
        path: 'boards',
        loadComponent: () =>
          import('./features/boards/board-list/board-list.component').then(
            (m) => m.BoardListComponent,
          ),
      },
      {
        path: 'boards/:id',
        loadComponent: () =>
          import('./features/boards/board-detail/board-detail.component').then(
            (m) => m.BoardDetailComponent,
          ),
      },
      {
        path: 'boards/:id/entry',
        loadComponent: () =>
          import('./features/boards/daily-entry/daily-entry.component').then(
            (m) => m.DailyEntryComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'boards' },
];
