import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, UsersController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedRequest } from './jwt-auth.guard';

const mockAuthResponse = {
  accessToken: 'jwt-token',
  user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: '',
  createdAt: new Date(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest
              .fn()
              .mockResolvedValue({ message: 'Check your email' }),
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            verifyEmail: jest.fn().mockResolvedValue(mockAuthResponse),
            resendVerification: jest
              .fn()
              .mockResolvedValue({ message: 'Sent' }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            searchByEmail: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  describe('register', () => {
    it('delegates to authService.register and returns result', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'pass123',
        name: 'New User',
      };
      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Check your email' });
    });
  });

  describe('verifyEmail', () => {
    it('delegates token to authService.verifyEmail', async () => {
      const result = await controller.verifyEmail({ token: 'tok' });

      expect(authService.verifyEmail).toHaveBeenCalledWith('tok');
      expect(result).toBe(mockAuthResponse);
    });
  });

  describe('resendVerification', () => {
    it('delegates email to authService.resendVerification', async () => {
      const result = await controller.resendVerification({
        email: 'a@b.com',
      });

      expect(authService.resendVerification).toHaveBeenCalledWith('a@b.com');
      expect(result).toEqual({ message: 'Sent' });
    });
  });

  describe('login', () => {
    it('delegates to authService.login and returns result', async () => {
      const dto = { email: 'test@example.com', password: 'pass' };
      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockAuthResponse);
    });
  });

  describe('me', () => {
    it('returns user from usersService.findById using req.user.sub', async () => {
      const req = {
        user: { sub: 'user-1', email: 'test@example.com' },
      } as AuthenticatedRequest;

      const result = await controller.me(req);

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toBe(mockUser);
    });
  });
});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            searchByEmail: jest.fn().mockResolvedValue([mockUser]),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  describe('search', () => {
    it('delegates to usersService.searchByEmail', async () => {
      const result = await controller.search('test');

      expect(usersService.searchByEmail).toHaveBeenCalledWith('test');
      expect(result).toEqual([mockUser]);
    });

    it('passes empty string when email query param is undefined', async () => {
      await controller.search(undefined as unknown as string);

      expect(usersService.searchByEmail).toHaveBeenCalledWith('');
    });
  });
});
