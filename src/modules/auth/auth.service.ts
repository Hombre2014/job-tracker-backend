import * as bcrypt from 'bcrypt';
import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserFriendlyErrorMessages } from '../../exceptions/user-friendly-error-messages';
import { CustomHttpException } from '../../exceptions/custom.exception';
import { UserCodeVerificationService } from '../users/user-code-verification.service';
import {
  VerificationProcess,
  VerificationProcessType,
} from '../users/enums/verification-process.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { isStrongPassword } from '../../utils/password-strength.util';
import { SignInResponseDto } from './dtos/sign-in-response.dto';
import { UserMapper } from '../users/users.mapper';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userCodeVerificationService: UserCodeVerificationService,
  ) {}

  async signIn(email: string, password: string): Promise<SignInResponseDto> {
    const user = await this.usersService.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    if (!passwordIsCorrect) {
      throw new UnauthorizedException();
    }

    if (!user.isEmailVerified) {
      throw new CustomHttpException(
        'Email is not verified',
        HttpStatus.FORBIDDEN,
        UserFriendlyErrorMessages.EMAIL_NOT_VERIFIED,
      );
    }

    // Check password strength (using plain-text password before it's hashed)
    const passwordStrength = isStrongPassword(password) ? 'strong' : 'weak';

    const mapper = new UserMapper();
    const signInResponseDto = new SignInResponseDto(mapper.toDto(user), passwordStrength);

    return signInResponseDto;
  }

  async refreshToken(token: string): Promise<any> {
    let payload = null;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_REFRESH_TOKEN'),
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    // Don't include passwordStrength on refresh (user is already authenticated)
    return this.generateTokens(payload.sub, payload.email);
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email: email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN'),
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME', '7d'),
    });
    return { accessToken, refreshToken };
  }

  async resetEmail(email: string, code: string, newEmail: string) {
    await this.userCodeVerificationService.verifyUserCode(
      { email },
      code,
      VerificationProcess.USER_EMAIL_RESET,
    );

    const user = await this.usersService.findOneBy({ email });

    user.email = newEmail;
    await this.usersRepository.save(user);

    return this.generateTokens(user.id, newEmail);
  }

  async createAndSendEmailResetVerificationCode(
    userId: string,
    email: string,
    processType: VerificationProcessType,
  ) {
    this.userCodeVerificationService.createAndSendEmailResetVerificationCode(
      userId,
      email,
      processType,
    );
  }
}
