import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { BoardColumnsService } from './board-columns.service';
import { CreateBoardColumnDto } from './dtos/create-board-column.dto';
import { UpdateBoardColumnDto } from './dtos/update-board-column.dto';
import { BoardColumnMapper } from './board-columns.mapper';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';

@Controller('board-columns')
export class BoardColumnsController {
  constructor(
    private readonly boardColumnsService: BoardColumnsService,
    private readonly mapper: BoardColumnMapper,
  ) {}

  @Post()
  async createBoard(@Body() boardDto: CreateBoardColumnDto, @AuthUser() user: AuthUserDto) {
    const entity = await this.boardColumnsService.create(boardDto, user.userId);
    return this.mapper.toDto(entity);
  }

  @Get('/:id')
  async findColumns(@Param('id', ParseUUIDPipe) boardId: string, @AuthUser() user: AuthUserDto) {
    const entities = await this.boardColumnsService.findColumns(boardId, user.userId);
    return entities.map((e) => this.mapper.toDto(e));
  }

  @Put('/:id/rearrange')
  async rearrange(
    @Param('id', ParseUUIDPipe) boardId: string,
    @Body() columnIds: string[],
    @AuthUser() user: AuthUserDto,
  ) {
    await this.boardColumnsService.rearrangeColumns(boardId, columnIds, user.userId);
  }

  @Patch('/:id')
  async updateBoard(
    @Param('id', ParseUUIDPipe) columnId: string,
    @Body() body: UpdateBoardColumnDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.boardColumnsService.update(columnId, body, user.userId);
    return this.mapper.toDto(entity);
  }

  @Delete('/:id')
  async deleteBoard(@Param('id', ParseUUIDPipe) columnId: string, @AuthUser() user: AuthUserDto) {
    await this.boardColumnsService.remove(columnId, user.userId);
  }
}
