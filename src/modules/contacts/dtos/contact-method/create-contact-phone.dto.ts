import { IsString } from 'class-validator';
import { ContactPhoneDto } from './contact-phone.dto';

export class CreateContactPhoneDto extends ContactPhoneDto {
  @IsString()
  contactId: string;
}
