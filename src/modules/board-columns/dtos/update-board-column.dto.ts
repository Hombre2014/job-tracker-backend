import { IsString } from 'class-validator';

export class UpdateBoardColumnDto {
  @IsString()
  name?: string;
}
