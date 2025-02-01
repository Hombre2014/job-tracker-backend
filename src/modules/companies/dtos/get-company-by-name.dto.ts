import { IsString } from 'class-validator';

export class GetCompanyByNameDto {
  @IsString()
  name: string;
}
