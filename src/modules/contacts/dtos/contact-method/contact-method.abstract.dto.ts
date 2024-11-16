import { ContactMethodType, ContactMethodTypeEnum } from '../../enums/contact-type.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseDto } from '../../../../dtos/base.dto';

export abstract class ContactMethodDto extends BaseDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsEnum(ContactMethodTypeEnum)
  type: ContactMethodType;
}
