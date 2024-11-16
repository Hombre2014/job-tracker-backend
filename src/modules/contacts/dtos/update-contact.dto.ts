import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContact extends CreateContactDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
