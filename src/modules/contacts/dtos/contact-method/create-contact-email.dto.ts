import { IsString } from 'class-validator';
import { ContactEmailDto } from './contact-email.dto';

export class CreateContactEmailDto extends ContactEmailDto {
  @IsString()
  contactId: string;
}
