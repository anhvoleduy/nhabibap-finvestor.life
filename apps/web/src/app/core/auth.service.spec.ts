import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';

@Component({ template: '', standalone: true })
class StubComponent {}
import { AuthService } from './auth.service';

const mockResponse = {
  accessToken: 'test-jwt',
  user: { id: 'u1', email: 'user@example.com', name: 'User' },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: StubComponent }]),
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('token signal is null when localStorage empty', () => {
      expect(service.token()).toBeNull();
    });

    it('currentUser signal is null when localStorage empty', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('reads token from localStorage on init', () => {
      localStorage.setItem('pt_token', 'stored-token');
      const freshService = TestBed.runInInjectionContext(
        () => new AuthService(),
      );
      expect(freshService.token()).toBe('stored-token');
    });

    it('reads currentUser from localStorage on init', () => {
      localStorage.setItem('pt_user', JSON.stringify(mockResponse.user));
      const freshService = TestBed.runInInjectionContext(
        () => new AuthService(),
      );
      expect(freshService.currentUser()).toEqual(mockResponse.user);
    });
  });

  describe('isLoggedIn', () => {
    it('returns false when no token', () => {
      expect(service.isLoggedIn).toBe(false);
    });

    it('returns true after login', () => {
      service
        .login({ email: 'user@example.com', password: 'pass' })
        .subscribe();
      httpMock.expectOne('/api/auth/login').flush(mockResponse);
      expect(service.isLoggedIn).toBe(true);
    });
  });

  describe('login', () => {
    it('POSTs to /api/auth/login', () => {
      service
        .login({ email: 'user@example.com', password: 'pass' })
        .subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'user@example.com',
        password: 'pass',
      });
      req.flush(mockResponse);
    });

    it('persists token and user to localStorage', () => {
      service
        .login({ email: 'user@example.com', password: 'pass' })
        .subscribe();
      httpMock.expectOne('/api/auth/login').flush(mockResponse);

      expect(localStorage.getItem('pt_token')).toBe('test-jwt');
      expect(JSON.parse(localStorage.getItem('pt_user')!)).toEqual(
        mockResponse.user,
      );
    });

    it('updates token and currentUser signals', () => {
      service
        .login({ email: 'user@example.com', password: 'pass' })
        .subscribe();
      httpMock.expectOne('/api/auth/login').flush(mockResponse);

      expect(service.token()).toBe('test-jwt');
      expect(service.currentUser()).toEqual(mockResponse.user);
    });
  });

  describe('register', () => {
    it('POSTs to /api/auth/register', () => {
      service
        .register({
          email: 'new@example.com',
          password: 'pass123',
          name: 'New',
        })
        .subscribe();

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Check your email' });
    });

    it('does NOT persist token after register (verification required)', () => {
      service
        .register({ email: 'new@example.com', password: 'pass', name: 'New' })
        .subscribe();
      httpMock
        .expectOne('/api/auth/register')
        .flush({ message: 'Check your email' });

      expect(service.token()).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('verifyEmail', () => {
    it('POSTs token and persists returned auth', () => {
      service.verifyEmail('tok').subscribe();

      const req = httpMock.expectOne('/api/auth/verify-email');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'tok' });
      req.flush(mockResponse);

      expect(service.token()).toBe('test-jwt');
      expect(service.currentUser()).toEqual(mockResponse.user);
    });
  });

  describe('resendVerification', () => {
    it('POSTs email to /api/auth/resend-verification', () => {
      service.resendVerification({ email: 'new@example.com' }).subscribe();

      const req = httpMock.expectOne('/api/auth/resend-verification');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'new@example.com' });
      req.flush({ message: 'Sent' });
    });
  });

  describe('logout', () => {
    it('clears localStorage and resets signals', () => {
      localStorage.setItem('pt_token', 'test-jwt');
      localStorage.setItem('pt_user', JSON.stringify(mockResponse.user));
      service.token.set('test-jwt');
      service.currentUser.set(mockResponse.user);

      service.logout();

      expect(localStorage.getItem('pt_token')).toBeNull();
      expect(localStorage.getItem('pt_user')).toBeNull();
      expect(service.token()).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    it('navigates to /auth/login', () => {
      const spy = vi.spyOn(router, 'navigate');
      service.logout();
      expect(spy).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
