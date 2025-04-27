import { IsEmail, IsString } from 'class-validator';

export class ResetEmailDto {
  @IsString()
  code: string;

  @IsEmail()
  email: string;
}
