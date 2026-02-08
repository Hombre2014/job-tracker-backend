import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateDomainDto {
  @IsNotEmpty()
  @IsString()
  domain: string;
}

export class DomainValidationResultDto {
  exists: boolean;
  name?: string;
  logo?: string;
  domain?: string;
}
