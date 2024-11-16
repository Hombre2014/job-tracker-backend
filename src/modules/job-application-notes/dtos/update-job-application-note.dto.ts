import { IsOptional, IsString } from 'class-validator';

export class UpdateJobApplicationNote {
  @IsString()
  @IsOptional()
  content: string | null;
}
