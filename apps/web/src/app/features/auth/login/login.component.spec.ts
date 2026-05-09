import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Observable, of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = { login: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: 'boards', component: LoginComponent }]),
        provideAnimationsAsync(),
        provideTranslateService(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders email and password fields', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('form is invalid with empty fields', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('form is valid with email and password filled', () => {
    component.form.setValue({ email: 'user@example.com', password: 'pass' });
    expect(component.form.valid).toBe(true);
  });

  it('submit() does nothing when form invalid', () => {
    component.submit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submit() calls auth.login with form values', () => {
    authService.login.mockReturnValue(
      of({
        accessToken: 'tok',
        user: { id: '1', email: 'u@e.com', name: 'U' },
      }),
    );
    component.form.setValue({ email: 'user@example.com', password: 'secret' });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('navigates to /boards on success', () => {
    authService.login.mockReturnValue(
      of({
        accessToken: 'tok',
        user: { id: '1', email: 'u@e.com', name: 'U' },
      }),
    );
    component.form.setValue({ email: 'user@example.com', password: 'secret' });
    const spy = vi.spyOn(router, 'navigate');

    component.submit();

    expect(spy).toHaveBeenCalledWith(['/boards']);
  });

  it('sets error signal and clears loading on API error', () => {
    authService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );
    component.form.setValue({ email: 'user@example.com', password: 'wrong' });

    component.submit();

    expect(component.error()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });

  it('uses fallback message when error has no message', () => {
    authService.login.mockReturnValue(throwError(() => ({})));
    component.form.setValue({ email: 'user@example.com', password: 'pass' });

    component.submit();

    expect(component.error()).toBe('AUTH.LOGIN.ERROR_DEFAULT');
  });

  it('sets loading to true while request is in flight', () => {
    let emit!: (v: unknown) => void;
    authService.login.mockReturnValue(
      new Observable((obs) => {
        emit = (v) => obs.next(v);
      }),
    );
    component.form.setValue({ email: 'user@example.com', password: 'pass' });

    component.submit();

    expect(component.loading()).toBe(true);
    emit({
      accessToken: 'tok',
      user: { id: '1', email: 'u@e.com', name: 'U' },
    });
  });
});
