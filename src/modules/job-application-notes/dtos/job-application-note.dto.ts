import { IsNumber, IsString, IsUUID } from 'class-validator';
import { BaseDto } from '../../../dtos/base.dto';

export class JobApplicationNoteDto extends BaseDto {
  @IsUUID()
  jobApplicationId: string;

  @IsString()
  content: string | null;

  @IsNumber()
  order: number;
}
