import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/auth.service';

let auth: {
  currentUser: ReturnType<typeof signal<{ name: string; email: string } | null>>;
  updateProfile: ReturnType<typeof vi.fn>;
  updatePassword: ReturnType<typeof vi.fn>;
};

function setup(
  overrides: Partial<typeof auth> = {},
): {
  fixture: ComponentFixture<SettingsComponent>;
  component: SettingsComponent;
} {
  auth = {
    currentUser: signal({ name: 'Existing', email: 'old@e.com' }),
    updateProfile: vi.fn().mockReturnValue(of({})),
    updatePassword: vi.fn().mockReturnValue(of({})),
    ...overrides,
  } as never;

  TestBed.configureTestingModule({
    imports: [SettingsComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: AuthService, useValue: auth },
    ],
  });
  const fixture = TestBed.createComponent(SettingsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('SettingsComponent', () => {
  describe('profileForm init', () => {
    it('prefills name + email from currentUser', () => {
      const { component } = setup();
      expect(component.profileForm.value).toEqual({
        name: 'Existing',
        email: 'old@e.com',
      });
    });
  });

  describe('submitProfile', () => {
    it('skips when form pristine', () => {
      const { component } = setup();
      component.submitProfile();
      expect(auth.updateProfile).not.toHaveBeenCalled();
    });

    it('skips when form invalid', () => {
      const { component } = setup();
      component.profileForm.patchValue({ email: 'bad' });
      component.submitProfile();
      expect(auth.updateProfile).not.toHaveBeenCalled();
    });

    it('calls updateProfile and sets success on success', () => {
      const { component } = setup();
      component.profileForm.patchValue({ name: 'New' });
      component.profileForm.markAsDirty();

      component.submitProfile();

      expect(auth.updateProfile).toHaveBeenCalledWith({
        name: 'New',
        email: 'old@e.com',
      });
      expect(component.profileSuccess()).toBe(true);
      expect(component.profileLoading()).toBe(false);
    });

    it('sets error message on failure', () => {
      const { component } = setup({
        updateProfile: vi
          .fn()
          .mockReturnValue(throwError(() => ({ error: { message: 'no' } }))),
      });
      component.profileForm.patchValue({ name: 'New' });
      component.profileForm.markAsDirty();

      component.submitProfile();

      expect(component.profileError()).toBe('no');
      expect(component.profileLoading()).toBe(false);
    });
  });

  describe('submitPassword', () => {
    it('skips when invalid', () => {
      const { component } = setup();
      component.submitPassword();
      expect(auth.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects mismatched confirm', () => {
      const { component } = setup();
      component.pwForm.patchValue({
        currentPassword: 'old',
        newPassword: 'newpassword1',
        confirmPassword: 'different',
      });
      expect(component.pwForm.hasError('mismatch')).toBe(true);
      component.submitPassword();
      expect(auth.updatePassword).not.toHaveBeenCalled();
    });

    it('calls updatePassword and resets form on success', () => {
      const { component } = setup();
      component.pwForm.patchValue({
        currentPassword: 'old',
        newPassword: 'newpassword1',
        confirmPassword: 'newpassword1',
      });

      component.submitPassword();

      expect(auth.updatePassword).toHaveBeenCalledWith({
        currentPassword: 'old',
        newPassword: 'newpassword1',
      });
      expect(component.pwSuccess()).toBe(true);
      expect(component.pwForm.value.currentPassword).toBeFalsy();
    });

    it('sets error message on failure', () => {
      const { component } = setup({
        updatePassword: vi
          .fn()
          .mockReturnValue(throwError(() => ({ error: { message: 'bad' } }))),
      });
      component.pwForm.patchValue({
        currentPassword: 'old',
        newPassword: 'newpassword1',
        confirmPassword: 'newpassword1',
      });

      component.submitPassword();

      expect(component.pwError()).toBe('bad');
    });
  });
});
