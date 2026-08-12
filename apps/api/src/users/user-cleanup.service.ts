import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service';
import { EmailService } from '../email/email.service';

const VERIFICATION_DEADLINE_DAYS = 30;
const WARNING_DAYS_BEFORE_DEADLINE = 5;

@Injectable()
export class UserCleanupService {
  private readonly logger = new Logger(UserCleanupService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    await this.warnUsersApproachingDeadline();
    await this.deleteExpiredUnverifiedUsers();
  }

  async warnUsersApproachingDeadline(): Promise<number> {
    const now = Date.now();
    const warningCutoff = new Date(
      now -
        (VERIFICATION_DEADLINE_DAYS - WARNING_DAYS_BEFORE_DEADLINE) *
          86_400_000,
    );
    const deletionCutoff = new Date(
      now - VERIFICATION_DEADLINE_DAYS * 86_400_000,
    );
    const users = await this.usersService.findUnverifiedDueForWarning(
      deletionCutoff,
      warningCutoff,
    );
    for (const user of users) {
      try {
        await this.emailService.sendUnverifiedAccountWarningEmail(
          user.email,
          user.name,
          WARNING_DAYS_BEFORE_DEADLINE,
        );
        await this.usersService.markUnverifiedWarningEmailSent(user);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        this.logger.error(`Failed to warn user ${user.id}: ${message}`);
      }
    }
    if (users.length) {
      this.logger.log(
        `Sent unverified-account warning to ${users.length} user(s).`,
      );
    }
    return users.length;
  }

  async deleteExpiredUnverifiedUsers(): Promise<number> {
    const deletionCutoff = new Date(
      Date.now() - VERIFICATION_DEADLINE_DAYS * 86_400_000,
    );
    const users =
      await this.usersService.findUnverifiedDueForDeletion(deletionCutoff);
    for (const user of users) {
      this.logger.log(
        `Soft-deleting unverified user ${user.id} (${user.email}), created ${user.createdAt.toISOString()}.`,
      );
      await this.usersService.softDeleteUser(user);
    }
    return users.length;
  }
}
