import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Observable, of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/auth.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authService: { register: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = { register: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([
          { path: 'boards', component: RegisterComponent },
          { path: 'auth/login', component: RegisterComponent },
        ]),
        provideAnimationsAsync(),
        provideTranslateService(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('form is invalid when empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('toggles password visibility', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(
      el.querySelector('input[formControlName="password"]'),
    ).toHaveProperty('type', 'password');

    const toggle = el.querySelector<HTMLButtonElement>('button[matSuffix]');
    toggle?.click();
    fixture.detectChanges();

    expect(component.hidePassword()).toBe(false);
    expect(
      el.querySelector('input[formControlName="password"]'),
    ).toHaveProperty('type', 'text');
  });

  it('form is valid with all fields filled', () => {
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
    expect(component.form.valid).toBe(true);
  });

  it('password requires minimum 6 chars', () => {
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: '12345',
    });
    expect(component.form.get('password')?.hasError('minlength')).toBe(true);
  });

  it('submit() does nothing when form invalid', () => {
    component.submit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('submit() calls auth.register with form values', () => {
    authService.register.mockReturnValue(of({ message: 'Check your email' }));
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    component.submit();

    expect(authService.register).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
  });

  it('navigates to login with registered flag on success', () => {
    authService.register.mockReturnValue(of({ message: 'Check your email' }));
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
    const spy = vi.spyOn(router, 'navigate');

    component.submit();

    expect(spy).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { registered: 1 },
    });
  });

  it('sets error signal and clears loading on API error', () => {
    authService.register.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already taken' } })),
    );
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    component.submit();

    expect(component.error()).toBe('Email already taken');
    expect(component.loading()).toBe(false);
  });

  it('uses translate key as fallback when error has no message', () => {
    authService.register.mockReturnValue(throwError(() => ({})));
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    component.submit();

    expect(component.error()).toBe('AUTH.REGISTER.ERROR_DEFAULT');
  });

  it('sets loading to true while request is in flight', () => {
    let emit!: (v: unknown) => void;
    authService.register.mockReturnValue(
      new Observable((obs) => {
        emit = (v) => obs.next(v);
      }),
    );
    component.form.setValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    component.submit();

    expect(component.loading()).toBe(true);
    emit({
      accessToken: 'tok',
      user: { id: '1', email: 'alice@example.com', name: 'Alice' },
    });
  });
});
