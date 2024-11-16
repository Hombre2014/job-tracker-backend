import { BoardColumnDto } from '../../board-columns/dtos/board-column.dto';
import { BaseDto } from '../../../dtos/base.dto';

export class BoardDto extends BaseDto {
  userId: string;

  name: string;

  isArchived: boolean;

  columns: BoardColumnDto[];
}
