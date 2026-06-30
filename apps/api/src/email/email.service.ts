import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(private readonly cfg: ConfigService) {
    const apiKey = this.cfg.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.cfg.get<string>('MAIL_FROM') ?? 'onboarding@resend.dev';
    this.webUrl = this.cfg.get<string>('WEB_URL') ?? 'http://localhost:4200';
    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY not set — verification emails will not be sent.',
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const link = `${this.webUrl}/verify-email?token=${token}`;
    if (!this.resend) {
      this.logger.warn(`Skipped verification email to ${to}. Link: ${link}`);
      return;
    }
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Verify your email',
      html: `<p>Hi ${name},</p>
<p>Confirm your email address to activate your account:</p>
<p><a href="${link}">Verify email</a></p>
<p>This link expires in 24 hours. If you did not sign up, ignore this email.</p>`,
    });
    if (error) {
      this.logger.error(`Resend failed for ${to}: ${error.message}`);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}
