import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../../../core/auth.service';

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let component: VerifyEmailComponent;
  let authService: { verifyEmail: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = { verifyEmail: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([
          { path: 'boards', component: VerifyEmailComponent },
          { path: 'auth/login', component: VerifyEmailComponent },
        ]),
        provideAnimationsAsync(),
        provideTranslateService(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('shows error state when token missing', () => {
    fixture.detectChanges();
    expect(component.state()).toBe('error');
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });

  it('verifies and navigates to boards on success', () => {
    vi.useFakeTimers();
    try {
      authService.verifyEmail.mockReturnValue(
        of({
          accessToken: 'tok',
          user: { id: '1', email: 'a@b.com', name: 'A' },
        }),
      );
      const spy = vi.spyOn(router, 'navigate');
      fixture.componentRef.setInput('token', 'valid-tok');
      fixture.detectChanges();

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-tok');
      expect(component.state()).toBe('success');

      vi.advanceTimersByTime(1500);
      expect(spy).toHaveBeenCalledWith(['/boards']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows error state with message on failure', () => {
    authService.verifyEmail.mockReturnValue(
      throwError(() => ({ error: { message: 'Token expired' } })),
    );
    fixture.componentRef.setInput('token', 'bad-tok');
    fixture.detectChanges();

    expect(component.state()).toBe('error');
    expect(component.error()).toBe('Token expired');
  });
});
