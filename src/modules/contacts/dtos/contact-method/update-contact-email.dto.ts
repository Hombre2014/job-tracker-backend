import { IsString } from 'class-validator';
import { ContactEmailDto } from './contact-email.dto';

export class CreateContactMethodEmailDto extends ContactEmailDto {
  @IsString()
  id: string;
}
