import { IsEmail } from 'class-validator';
import { ContactMethodDto } from './contact-method.abstract.dto';

export class ContactEmailDto extends ContactMethodDto {
  @IsEmail()
  email: string;
}
