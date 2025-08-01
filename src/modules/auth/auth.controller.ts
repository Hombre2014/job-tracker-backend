import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { Public } from './public.decorator';
import { AuthUser } from './user.decorator';
import { AuthUserDto } from './dtos/auth.user.dto';
import { VerificationProcess } from '../users/enums/verification-process.enum';
import { ResetEmailDto } from '../users/dtos/reset-email.dto';
import { ConfigService } from '@nestjs/config';
import ms = require('ms');

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto, @Res() res: any) {
    const tokens = await this.authService.signIn(signInDto.email, signInDto.password);

    const accessExpiration = this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h');
    const refreshExpiration = this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME', '1h');

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production', // only over HTTPS
      sameSite: 'strict',
      maxAge: ms(accessExpiration),
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production', // only over HTTPS
      sameSite: 'strict',
      maxAge: ms(refreshExpiration),
    });

    return res.status(HttpStatus.OK).json();
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Request() req: any) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    return this.authService.refreshToken(token);
  }

  @Get('profile')
  getProfile(@AuthUser() user: AuthUserDto) {
    return user;
  }

  @Post('/reset-email/create-verification-code')
  async startEmailReset(
    @AuthUser() { userId }: AuthUserDto,
    @Body() { email: newEmail }: { email: string },
  ) {
    await this.authService.createAndSendEmailResetVerificationCode(
      userId,
      newEmail,
      VerificationProcess.USER_EMAIL_RESET,
    );
  }

  @Post('/reset-email')
  async resetEmail(
    @AuthUser() { email }: AuthUserDto,
    @Body() { code, email: newEmail }: ResetEmailDto,
  ) {
    return this.authService.resetEmail(email, code, newEmail);
  }
}
