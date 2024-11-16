import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateJobApplicationNoteDto {
  @IsOptional()
  @IsUUID()
  jobApplicationId?: string;

  @IsString()
  @IsOptional()
  content: string | null;
}
