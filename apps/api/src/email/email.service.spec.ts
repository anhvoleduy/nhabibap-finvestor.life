import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

const sendTransacEmailMock = jest.fn();
jest.mock('@getbrevo/brevo', () => ({
  BrevoClient: jest.fn().mockImplementation(() => ({
    transactionalEmails: { sendTransacEmail: sendTransacEmailMock },
  })),
}));

import { EmailService } from './email.service';

function build(config: Record<string, string | undefined>) {
  return Test.createTestingModule({
    providers: [
      EmailService,
      {
        provide: ConfigService,
        useValue: { get: (k: string) => config[k] },
      },
    ],
  }).compile();
}

describe('EmailService', () => {
  beforeEach(() => {
    sendTransacEmailMock.mockReset();
  });

  describe('with BREVO_API_KEY set', () => {
    let service: EmailService;

    beforeEach(async () => {
      const module: TestingModule = await build({
        BREVO_API_KEY: 'key',
        MAIL_FROM: 'from@test.dev',
        MAIL_FROM_NAME: 'Finvestor.Life',
        WEB_URL: 'https://app.test',
      });
      service = module.get(EmailService);
    });

    it('sends email with verification link', async () => {
      sendTransacEmailMock.mockResolvedValue({});

      await service.sendVerificationEmail('to@test.dev', 'Bob', 'tok123');

      expect(sendTransacEmailMock).toHaveBeenCalledTimes(1);
      const arg = sendTransacEmailMock.mock.calls[0][0];
      expect(arg.sender).toEqual({
        email: 'from@test.dev',
        name: 'Finvestor.Life',
      });
      expect(arg.to).toEqual([{ email: 'to@test.dev', name: 'Bob' }]);
      expect(arg.htmlContent).toContain(
        'https://app.test/auth/verify-email?token=tok123',
      );
      expect(arg.htmlContent).toContain('Bob');
    });

    it('throws when Brevo rejects the request', async () => {
      sendTransacEmailMock.mockRejectedValue(new Error('boom'));

      await expect(
        service.sendVerificationEmail('to@test.dev', 'Bob', 'tok'),
      ).rejects.toThrow(/boom/);
    });
  });

  describe('without MAIL_FROM_NAME set', () => {
    it('defaults sender name to Finvestor.Life', async () => {
      sendTransacEmailMock.mockResolvedValue({});
      const module: TestingModule = await build({
        BREVO_API_KEY: 'key',
        MAIL_FROM: 'from@test.dev',
        WEB_URL: 'https://app.test',
      });
      const service = module.get(EmailService);

      await service.sendVerificationEmail('to@test.dev', 'Bob', 'tok');

      const arg = sendTransacEmailMock.mock.calls[0][0];
      expect(arg.sender).toEqual({
        email: 'from@test.dev',
        name: 'Finvestor.Life',
      });
    });
  });

  describe('without BREVO_API_KEY', () => {
    it('skips sending and does not throw', async () => {
      const module: TestingModule = await build({});
      const service = module.get(EmailService);

      await expect(
        service.sendVerificationEmail('to@test.dev', 'Bob', 'tok'),
      ).resolves.toBeUndefined();
      expect(sendTransacEmailMock).not.toHaveBeenCalled();
    });
  });
});
