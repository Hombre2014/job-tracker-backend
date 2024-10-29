import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserRoleType } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRoleType;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
