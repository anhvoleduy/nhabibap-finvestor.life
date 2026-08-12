import { Test, TestingModule } from '@nestjs/testing';
import { UserCleanupService } from './user-cleanup.service';
import { UsersService } from './users.service';
import { EmailService } from '../email/email.service';
import { User } from '../auth/entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
    createdAt: new Date(),
    unverifiedWarningEmailSentAt: null,
    ...overrides,
  }) as User;

describe('UserCleanupService', () => {
  let service: UserCleanupService;
  let usersService: {
    findUnverifiedDueForWarning: jest.Mock;
    findUnverifiedDueForDeletion: jest.Mock;
    markUnverifiedWarningEmailSent: jest.Mock;
    softDeleteUser: jest.Mock;
  };
  let emailService: { sendUnverifiedAccountWarningEmail: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findUnverifiedDueForWarning: jest.fn().mockResolvedValue([]),
      findUnverifiedDueForDeletion: jest.fn().mockResolvedValue([]),
      markUnverifiedWarningEmailSent: jest.fn().mockResolvedValue(undefined),
      softDeleteUser: jest.fn().mockResolvedValue(undefined),
    };
    emailService = {
      sendUnverifiedAccountWarningEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCleanupService,
        { provide: UsersService, useValue: usersService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(UserCleanupService);
  });

  describe('warnUsersApproachingDeadline', () => {
    it('sends a warning email and stamps each due user', async () => {
      const user = makeUser();
      usersService.findUnverifiedDueForWarning.mockResolvedValue([user]);

      const count = await service.warnUsersApproachingDeadline();

      expect(
        emailService.sendUnverifiedAccountWarningEmail,
      ).toHaveBeenCalledWith(user.email, user.name, 5);
      expect(usersService.markUnverifiedWarningEmailSent).toHaveBeenCalledWith(
        user,
      );
      expect(count).toBe(1);
    });

    it('does not warn already-verified or already-warned users, since the query already excludes them', async () => {
      usersService.findUnverifiedDueForWarning.mockResolvedValue([]);

      const count = await service.warnUsersApproachingDeadline();

      expect(
        emailService.sendUnverifiedAccountWarningEmail,
      ).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('continues warning remaining users when one email send fails', async () => {
      const failing = makeUser({ id: 'fail-1', email: 'fail@example.com' });
      const ok = makeUser({ id: 'ok-1', email: 'ok@example.com' });
      usersService.findUnverifiedDueForWarning.mockResolvedValue([failing, ok]);
      emailService.sendUnverifiedAccountWarningEmail
        .mockRejectedValueOnce(new Error('brevo down'))
        .mockResolvedValueOnce(undefined);

      const count = await service.warnUsersApproachingDeadline();

      expect(usersService.markUnverifiedWarningEmailSent).toHaveBeenCalledTimes(
        1,
      );
      expect(usersService.markUnverifiedWarningEmailSent).toHaveBeenCalledWith(
        ok,
      );
      expect(count).toBe(2);
    });
  });

  describe('deleteExpiredUnverifiedUsers', () => {
    it('soft-deletes each user past the 30-day deadline', async () => {
      const user = makeUser({ id: 'expired-1' });
      usersService.findUnverifiedDueForDeletion.mockResolvedValue([user]);

      const count = await service.deleteExpiredUnverifiedUsers();

      expect(usersService.softDeleteUser).toHaveBeenCalledWith(user);
      expect(count).toBe(1);
    });

    it('does nothing when no users are past the deadline', async () => {
      usersService.findUnverifiedDueForDeletion.mockResolvedValue([]);

      const count = await service.deleteExpiredUnverifiedUsers();

      expect(usersService.softDeleteUser).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });
  });

  describe('handleCron', () => {
    it('runs warning pass before deletion pass', async () => {
      const calls: string[] = [];
      usersService.findUnverifiedDueForWarning.mockImplementation(async () => {
        calls.push('warn');
        return [];
      });
      usersService.findUnverifiedDueForDeletion.mockImplementation(async () => {
        calls.push('delete');
        return [];
      });

      await service.handleCron();

      expect(calls).toEqual(['warn', 'delete']);
    });
  });
});
