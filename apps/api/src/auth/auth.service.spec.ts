import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed',
  createdAt: new Date(),
} as import('../auth/entities/user.entity').User;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('jwt-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('hashes password and creates user', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: mockUser.email,
        password: 'password123',
        name: mockUser.name,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
        mockUser.name,
      );
      const [, hash] = usersService.create.mock.calls[0];
      expect(await bcrypt.compare('password123', hash)).toBe(true);
      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: { id: mockUser.id, email: mockUser.email, name: mockUser.name },
      });
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
    });
  });

  describe('login', () => {
    it('returns token for valid credentials', async () => {
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
  });
});
