import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed',
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationTokenExpiresAt: null,
  createdAt: new Date(),
} as import('../auth/entities/user.entity').User;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findByVerificationToken: jest.fn(),
            setVerificationToken: jest.fn(),
            markEmailVerified: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('jwt-token') },
        },
        {
          provide: EmailService,
          useValue: { sendVerificationEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
  });

  describe('register', () => {
    it('hashes password, creates unverified user, and sends verification email', async () => {
      usersService.create.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      const result = await service.register({
        email: mockUser.email,
        password: 'password123',
        name: mockUser.name,
      });

      const [email, hash, name, token, expiresAt] =
        usersService.create.mock.calls[0];
      expect(email).toBe(mockUser.email);
      expect(name).toBe(mockUser.name);
      expect(await bcrypt.compare('password123', hash)).toBe(true);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        token,
      );
      expect(result.message).toMatch(/verify/i);
      expect(result).not.toHaveProperty('accessToken');
    });

    it('propagates ConflictException from UsersService', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        service.register({
          email: 'dup@example.com',
          password: 'pass',
          name: 'Dup',
        }),
      ).rejects.toThrow(ConflictException);
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns token for valid, verified credentials', async () => {
      const hash = await bcrypt.hash('secret', 10);
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });

      const result = await service.login({
        email: mockUser.email,
        password: 'secret',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });

      await expect(
        service.login({ email: mockUser.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email not verified', async () => {
      const hash = await bcrypt.hash('secret', 10);
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        emailVerified: false,
      });

      await expect(
        service.login({ email: mockUser.email, password: 'secret' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('marks user verified and returns token for valid token', async () => {
      const unverified = {
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'tok',
        emailVerificationTokenExpiresAt: new Date(Date.now() + 10000),
      };
      usersService.findByVerificationToken.mockResolvedValue(unverified);
      usersService.markEmailVerified.mockResolvedValue(mockUser);

      const result = await service.verifyEmail('tok');

      expect(usersService.markEmailVerified).toHaveBeenCalledWith(unverified);
      expect(result.accessToken).toBe('jwt-token');
    });

    it('throws BadRequestException for unknown token', async () => {
      usersService.findByVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('nope')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for expired token', async () => {
      usersService.findByVerificationToken.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'tok',
        emailVerificationTokenExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail('tok')).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.markEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('issues new token and sends email for unverified user', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      const result = await service.resendVerification(mockUser.email);

      expect(usersService.setVerificationToken).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('does nothing but returns message when user missing', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.resendVerification('ghost@example.com');

      expect(usersService.setVerificationToken).not.toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });

    it('does not resend for already verified user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await service.resendVerification(mockUser.email);

      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
