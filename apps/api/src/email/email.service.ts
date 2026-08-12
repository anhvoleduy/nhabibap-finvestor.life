import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly brevo: BrevoClient | null;
  private readonly from: string;
  private readonly fromName: string;
  private readonly webUrl: string;

  constructor(private readonly cfg: ConfigService) {
    const apiKey = this.cfg.get<string>('BREVO_API_KEY');
    this.brevo = apiKey ? new BrevoClient({ apiKey }) : null;
    this.from = this.cfg.get<string>('MAIL_FROM') ?? 'onboarding@brevo.dev';
    this.fromName = this.cfg.get<string>('MAIL_FROM_NAME') ?? 'Finvestor.Life';
    this.webUrl = this.cfg.get<string>('WEB_URL') ?? 'http://localhost:4200';
    if (!this.brevo) {
      this.logger.warn(
        'BREVO_API_KEY not set — verification emails will not be sent.',
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const link = `${this.webUrl}/auth/verify-email?token=${token}`;
    if (!this.brevo) {
      this.logger.warn(`Skipped verification email to ${to}. Link: ${link}`);
      return;
    }
    try {
      await this.brevo.transactionalEmails.sendTransacEmail({
        sender: { email: this.from, name: this.fromName },
        to: [{ email: to, name }],
        subject: 'Verify your email to activate your Finvestor account',
        htmlContent: this.verificationEmailHtml(name, link),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Brevo failed for ${to}: ${message}`);
      throw new Error(`Failed to send verification email: ${message}`);
    }
  }

  async sendUnverifiedAccountWarningEmail(
    to: string,
    name: string,
    daysRemaining: number,
  ): Promise<void> {
    const link = `${this.webUrl}/auth/resend-verification`;
    if (!this.brevo) {
      this.logger.warn(`Skipped unverified-account warning email to ${to}.`);
      return;
    }
    try {
      await this.brevo.transactionalEmails.sendTransacEmail({
        sender: { email: this.from, name: this.fromName },
        to: [{ email: to, name }],
        subject: 'Verify your email before your Finvestor account is removed',
        htmlContent: this.unverifiedWarningEmailHtml(name, link, daysRemaining),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`Brevo failed for ${to}: ${message}`);
      throw new Error(
        `Failed to send unverified-account warning email: ${message}`,
      );
    }
  }

  private unverifiedWarningEmailHtml(
    name: string,
    link: string,
    daysRemaining: number,
  ): string {
    return `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#0f172a; padding:24px 32px;">
                <span style="color:#ffffff; font-size:18px; font-weight:600; letter-spacing:0.2px;">Finvestor</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:20px; color:#0f172a;">Your account will be removed soon</h1>
                <p style="margin:0 0 8px; font-size:15px; line-height:1.5; color:#475569;">Hi ${name},</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.5; color:#475569;">
                  Your email address is still unverified. In ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}, your Finvestor account and its data will be permanently removed unless you verify your email.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px; background-color:#2563eb;">
                      <a href="${link}" style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">
                        Resend verification email
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private verificationEmailHtml(name: string, link: string): string {
    return `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#0f172a; padding:24px 32px;">
                <span style="color:#ffffff; font-size:18px; font-weight:600; letter-spacing:0.2px;">Finvestor</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:20px; color:#0f172a;">Confirm your email</h1>
                <p style="margin:0 0 8px; font-size:15px; line-height:1.5; color:#475569;">Hi ${name},</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.5; color:#475569;">
                  Thanks for signing up. Confirm your email address to activate your account and start tracking your portfolio.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px; background-color:#2563eb;">
                      <a href="${link}" style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">
                        Verify email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0; font-size:13px; line-height:1.5; color:#94a3b8;">
                  This link expires in 24 hours. If you did not sign up for Finvestor, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0;">
                <p style="margin:0; font-size:12px; color:#94a3b8;">
                  Trouble with the button? Paste this link into your browser:<br />
                  <a href="${link}" style="color:#2563eb; word-break:break-all;">${link}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
