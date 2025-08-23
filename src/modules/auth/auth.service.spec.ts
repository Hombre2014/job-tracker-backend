/* eslint-disable */
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CustomHttpException } from '../../exceptions/custom.exception';
import { VerificationProcess } from '../users/enums/verification-process.enum';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepository = {
    save: jest.fn(),
  } as any;

  const mockUsersService = {
    findOneBy: jest.fn(),
  } as any;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as any;

  const mockConfigService = {
    get: jest.fn(),
  } as any;

  const mockUserCodeVerificationService = {
    verifyUserCode: jest.fn(),
    createAndSendEmailResetVerificationCode: jest.fn(),
  } as any;

  const user = {
    id: 'user-id-1',
    email: 'old@example.com',
    password: 'hashed-password',
    isEmailVerified: true,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'JWT_ACCESS_TOKEN') {
        return 'access-secret';
      }
      if (key === 'JWT_REFRESH_TOKEN') {
        return 'refresh-secret';
      }
      if (key === 'JWT_ACCESS_TOKEN_EXPIRATION_TIME') {
        return '1h';
      }
      if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_TIME') {
        return '7d';
      }

      return defaultValue;
    });

    service = new AuthService(
      mockUsersRepository,
      mockUsersService,
      mockJwtService,
      mockConfigService,
      mockUserCodeVerificationService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signIn', () => {
    it('throws UnauthorizedException when user not found', async () => {

      await expect(
        service.signIn('noone@example.com', 'password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mockUsersService.findOneBy).toHaveBeenCalledWith({ email: 'noone@example.com' });
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      mockUsersService.findOneBy.mockResolvedValue(user);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(false);

      await expect(
        service.signIn(user.email, 'wrong-password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect((bcrypt as any).compare).toHaveBeenCalledWith('wrong-password', user.password);
    });

    it('throws CustomHttpException when email is not verified', async () => {
      const unverifiedUser = { ...user, isEmailVerified: false };
      mockUsersService.findOneBy.mockResolvedValue(unverifiedUser);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);

      await expect(
        service.signIn(unverifiedUser.email, 'password'),
      ).rejects.toBeInstanceOf(CustomHttpException);
    });

    it('returns access and refresh tokens on success', async () => {
      mockUsersService.findOneBy.mockResolvedValue(user);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const tokens = await service.signIn(user.email, 'password');

      expect(tokens).toHaveProperty('accessToken', 'access-token');
      expect(tokens).toHaveProperty('refreshToken', 'refresh-token');

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('throws UnauthorizedException when token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(service.refreshToken('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns new tokens when refresh token is valid', async () => {
      const payload = { sub: user.id, email: user.email };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const tokens = await service.refreshToken('valid-token');

      expect(tokens).toHaveProperty('accessToken', 'new-access');
      expect(tokens).toHaveProperty('refreshToken', 'new-refresh');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'refresh-secret' });
    });
  });

  describe('resetEmail', () => {
    it('verifies code, updates email and returns new tokens', async () => {
      const code = '123456';
      const newEmail = 'new@example.com';

      mockUserCodeVerificationService.verifyUserCode.mockResolvedValue(undefined);
      mockUsersService.findOneBy.mockResolvedValue({ ...user });

      const savedUser = { ...user, email: newEmail };
      mockUsersRepository.save.mockResolvedValue(savedUser);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access-after-reset')
        .mockResolvedValueOnce('refresh-after-reset');

      const originalEmail = user.email;
      const tokens = await service.resetEmail(originalEmail, code, newEmail);

      expect(mockUserCodeVerificationService.verifyUserCode).toHaveBeenCalledWith(
        { email: originalEmail },
        code,
        VerificationProcess.USER_EMAIL_RESET,
      );

      expect(mockUsersRepository.save).toHaveBeenCalled();
      expect(tokens).toHaveProperty('accessToken', 'access-after-reset');
      expect(tokens).toHaveProperty('refreshToken', 'refresh-after-reset');
    });
  });

  describe('createAndSendEmailResetVerificationCode', () => {
    it('delegates to userCodeVerificationService', async () => {
      await service.createAndSendEmailResetVerificationCode('user-id-1', 'me@example.com', 'some-process' as any);

      expect(mockUserCodeVerificationService.createAndSendEmailResetVerificationCode).toHaveBeenCalledWith(
        'user-id-1',
        'me@example.com',
        'some-process',
      );
    });
  });
});
