import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UserRole, UserRoleType } from '../enums/user-role.enum';
import { BaseDto } from '../../../dtos/base.dto';

export class UserDto extends BaseDto {
  @IsEmail()
  email: string;

  // @ApiProperty()
  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRoleType;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  profilePicUrl: string;
}
