import { Controller, Get } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardMapper } from './boards.mapper';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';

@Controller('boards-all')
export class BoardsAllController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly mapper: BoardMapper,
  ) {}

  @Get()
  async findBoard(@AuthUser() user: AuthUserDto) {
    const entities = await this.boardsService.getAllBoardsWithData(user.userId);
    return entities.map(this.mapper.toDto);
  }

  @Get('/job-applications')
  async fetchAllJobApplicationsCropped(@AuthUser() { userId }: AuthUserDto) {
    return this.boardsService.fetchAllJobApplicationsCropped(userId);
  }
}
