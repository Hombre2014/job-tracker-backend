import { IsOptional, IsString } from 'class-validator';

export class FindCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  domain?: string;
}
