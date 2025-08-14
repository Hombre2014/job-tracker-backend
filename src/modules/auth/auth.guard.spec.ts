import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthUserMapper } from './auth.user.mapper';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockJwtService: any;
  let mockReflector: any;
  let mockConfigService: any;
  let mapper: AuthUserMapper;

  beforeEach(() => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    };

    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    };

    mapper = new AuthUserMapper();

    guard = new AuthGuard(mockJwtService, mockReflector, mockConfigService, mapper);
  });

  function makeExecutionContext(request: any) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  }

  it('allows when route is public', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);

    const ctx = makeExecutionContext({});

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows OPTIONS requests', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);

    const request: any = { method: 'OPTIONS' };
    const ctx = makeExecutionContext(request);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws UnauthorizedException when authorization header is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);

    const request: any = { method: 'GET', headers: {} };
    const ctx = makeExecutionContext(request);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when authorization header is malformed', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);

    const request: any = { method: 'GET', headers: { authorization: 'Bad token' } };
    const ctx = makeExecutionContext(request);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when jwt verification fails', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('access-secret');
    mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    const request: any = { method: 'GET', headers: { authorization: 'Bearer some-token' } };
    const ctx = makeExecutionContext(request);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('some-token', {
      secret: 'access-secret',
    });
  });

  it('verifies token and maps payload to request.user on success', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('access-secret');

    const payload = { sub: 'user-123', email: 'me@example.com' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);

    const request: any = { method: 'GET', headers: { authorization: 'Bearer valid-token' } };
    const ctx = makeExecutionContext(request);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'access-secret',
    });
    expect(request.user).toBeDefined();
    expect(request.user.userId).toBe(payload.sub);
    expect(request.user.email).toBe(payload.email);
  });
});
