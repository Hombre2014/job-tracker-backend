import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { FindUsersDto } from './dtos/find-users.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserMapper } from './users.mapper';
import { Public } from '../auth/public.decorator';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { UserCodeVerificationService } from './user-code-verification.service';
import { EmailVerificationCodeDto } from './dtos/email-verification-code.dto';
import { CreateEmailVerificationCode } from './dtos/create-email-verification-code.dto';
import { VerificationProcess } from './enums/verification-process.enum';
import { DeleteUserDto } from './dtos/delete-user.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mapper: UserMapper,
    private readonly codeVerification: UserCodeVerificationService,
  ) {}

  @Post()
  @Public()
  @UseInterceptors(FileInterceptor('profilePic'))
  async createUser(@Body() body: CreateUserDto, @UploadedFile() profilePic: Express.Multer.File) {
    console.log(profilePic);
    if (!body.role) {
      body.role = 'user';
    }
    const entity = await this.usersService.create(body, profilePic);
    return this.mapper.toDto(entity);
  }

  @Get('/find')
  async findUsers(@Query() query: FindUsersDto) {
    const entities = await this.usersService.findBy(query);
    return entities.map(this.mapper.toDto);
  }

  @Get()
  async getUserDetails(@AuthUser() user: AuthUserDto) {
    const id = user.userId;
    const entity = await this.usersService.findOneBy({ id });
    return this.mapper.toDto(entity);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('profilePic'))
  async updateUser(
    @AuthUser() user: AuthUserDto,
    @Body() body: UpdateUserDto,
    @UploadedFile() profilePic: Express.Multer.File,
  ) {
    const entity = await this.usersService.update(user.userId, body, profilePic);
    return this.mapper.toDto(entity);
  }

  @Post('/delete/create-verification-code')
  async createVerificationCodeForDeletion(@AuthUser() user: AuthUserDto) {
    await this.codeVerification.createAndSendVerificationCode(
      user.email,
      VerificationProcess.USER_DELETE,
    );
  }

  @Delete()
  async deleteUser(@Body() dto: DeleteUserDto, @AuthUser() user: AuthUserDto) {
    await this.usersService.remove(user.userId, dto.code);
  }

  @Public()
  @Post('/verification/create-email-verification-code')
  async createEmailVerificationCode(@Body() body: CreateEmailVerificationCode) {
    await this.codeVerification.createAndSendVerificationCode(
      body.email,
      VerificationProcess.USER_SIGNUP,
    );
  }

  @Public()
  @Post('/verification/verify-email-code')
  async verifyEmailCode(@Body() body: EmailVerificationCodeDto) {
    await this.usersService.updateIsEmailVerified(body);
  }

  @Post('/update-password')
  async updatePassword(
    @AuthUser() { email }: AuthUserDto,
    @Body() { oldPassword, newPassword }: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(email, oldPassword, newPassword);
  }

  @Public()
  @Post('/reset-password/create-verification-code')
  async createVerificationCodeForPasswordReset(@Body() { email }: CreateEmailVerificationCode) {
    await this.codeVerification.createAndSendVerificationCode(
      email,
      VerificationProcess.USER_RESET_PASSWORD,
    );
  }

  @Public()
  @Post('/reset-password')
  async resetPassword(@Body() { email, code, newPassword }: ResetPasswordDto) {
    await this.usersService.resetPassword(email, code, newPassword);
  }
}
