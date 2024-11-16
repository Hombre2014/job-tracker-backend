import { IsString } from 'class-validator';
import { ContactPhoneDto } from './contact-phone.dto';

export class CreateContactMethodPhoneDto extends ContactPhoneDto {
  @IsString()
  id: string;
}
