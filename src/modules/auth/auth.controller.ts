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
import * as ms from 'ms';
import { SignInResponseDto } from './dtos/sign-in-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto, @Res() res: any): Promise<SignInResponseDto> {
    const response = await this.authService.signIn(signInDto.email, signInDto.password);
    const tokens = await this.authService.generateTokens(response.id, response.email);
    this.setTokensInCookies(res, tokens);
    return res.status(HttpStatus.OK).json(response);
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Request() req: any, @Res() res: any) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException();
    }

    const tokens = await this.authService.refreshToken(token);
    this.setTokensInCookies(res, tokens);
    return res.status(HttpStatus.OK).json();
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

  private setTokensInCookies(res: any, tokens: { accessToken: string; refreshToken: string }) {
    const accessExpiration = this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h');
    const refreshExpiration = this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME', '7d');
    const secure = this.configService.get('NODE_ENV') === 'production'; // only over HTTPS

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: secure,
      sameSite: 'strict',
      maxAge: ms(accessExpiration),
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: secure,
      sameSite: 'strict',
      maxAge: ms(refreshExpiration),
    });
  }
}
