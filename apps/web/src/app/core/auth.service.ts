import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  UserDto,
} from '@nhabibap-myportfolio/shared-types';

const TOKEN_KEY = 'pt_token';
const USER_KEY = 'pt_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly currentUser = signal<AuthResponseDto['user'] | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'),
  );

  get isLoggedIn() {
    return this.token() !== null;
  }

  register(dto: RegisterDto) {
    return this.http
      .post<AuthResponseDto>('/api/auth/register', dto)
      .pipe(tap((res) => this.persist(res)));
  }

  login(dto: LoginDto) {
    return this.http
      .post<AuthResponseDto>('/api/auth/login', dto)
      .pipe(tap((res) => this.persist(res)));
  }

  updateProfile(dto: UpdateProfileDto) {
    return this.http.patch<UserDto>('/api/users/me', dto).pipe(
      tap((user) => {
        const updated = {
          ...this.currentUser(),
          ...user,
        } as AuthResponseDto['user'];
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        this.currentUser.set(updated);
      }),
    );
  }

  updatePassword(dto: UpdatePasswordDto) {
    return this.http.patch<void>('/api/users/me/password', dto);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private persist(res: AuthResponseDto) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.token.set(res.accessToken);
    this.currentUser.set(res.user);
  }
}
