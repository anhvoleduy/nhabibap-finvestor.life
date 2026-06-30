import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

const sendMock = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
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
    sendMock.mockReset();
  });

  describe('with RESEND_API_KEY set', () => {
    let service: EmailService;

    beforeEach(async () => {
      const module: TestingModule = await build({
        RESEND_API_KEY: 'key',
        MAIL_FROM: 'from@test.dev',
        WEB_URL: 'https://app.test',
      });
      service = module.get(EmailService);
    });

    it('sends email with verification link', async () => {
      sendMock.mockResolvedValue({ error: null });

      await service.sendVerificationEmail('to@test.dev', 'Bob', 'tok123');

      expect(sendMock).toHaveBeenCalledTimes(1);
      const arg = sendMock.mock.calls[0][0];
      expect(arg.from).toBe('from@test.dev');
      expect(arg.to).toBe('to@test.dev');
      expect(arg.html).toContain('https://app.test/verify-email?token=tok123');
      expect(arg.html).toContain('Bob');
    });

    it('throws when Resend returns an error', async () => {
      sendMock.mockResolvedValue({ error: { message: 'boom' } });

      await expect(
        service.sendVerificationEmail('to@test.dev', 'Bob', 'tok'),
      ).rejects.toThrow(/boom/);
    });
  });

  describe('without RESEND_API_KEY', () => {
    it('skips sending and does not throw', async () => {
      const module: TestingModule = await build({});
      const service = module.get(EmailService);

      await expect(
        service.sendVerificationEmail('to@test.dev', 'Bob', 'tok'),
      ).resolves.toBeUndefined();
      expect(sendMock).not.toHaveBeenCalled();
    });
  });
});
