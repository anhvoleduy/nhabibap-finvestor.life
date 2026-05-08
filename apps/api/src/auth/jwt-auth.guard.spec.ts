import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

const mockPayload = { sub: 'user-1', email: 'test@example.com' };

function makeContext(
  overrides: {
    isPublic?: boolean;
    authHeader?: string;
    hasHandler?: boolean;
  } = {},
): ExecutionContext {
  const { isPublic = false, authHeader = '', hasHandler = true } = overrides;

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  };

  const request = {
    headers: { authorization: authHeader },
    user: undefined as unknown,
  };

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
    _request: request,
    _reflector: reflector,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: { verify: jest.fn().mockReturnValue(mockPayload) },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
    jwtService = module.get(JwtService);
    reflector = module.get(Reflector);
  });

  it('returns true for @Public() endpoints without checking token', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeContext({ isPublic: true });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('validates token and attaches user to request', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ authHeader: 'Bearer valid.jwt.token' });

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token');
    const req = ctx.switchToHttp().getRequest<{ user: unknown }>();
    expect(req.user).toEqual(mockPayload);
  });

  it('throws UnauthorizedException when Authorization header missing', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ authHeader: '' });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when header is not Bearer', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ authHeader: 'Basic dXNlcjpwYXNz' });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when JwtService.verify throws', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const ctx = makeContext({ authHeader: 'Bearer expired.jwt.token' });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('extracts token correctly by stripping Bearer prefix', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeContext({ authHeader: 'Bearer my.actual.token' });

    guard.canActivate(ctx);

    expect(jwtService.verify).toHaveBeenCalledWith('my.actual.token');
  });
});
