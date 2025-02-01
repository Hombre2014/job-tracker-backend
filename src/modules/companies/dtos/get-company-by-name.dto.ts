import { IsString } from 'class-validator';

export class CompanyNameDto {
  @IsString()
  name: string;
}
