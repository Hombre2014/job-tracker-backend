import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateBoardDto } from './dtos/create-board.dto';
import { BoardsService } from './boards.service';
import { FindBoardDto } from './dtos/find-board.dto';
import { UpdateBoardDto } from './dtos/update-board.dto';
import { BoardMapper } from './boards.mapper';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';

@Controller('boards')
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly mapper: BoardMapper,
  ) {}

  @Post()
  async createBoard(@Body() boardDto: CreateBoardDto, @AuthUser() user: AuthUserDto) {
    const entity = await this.boardsService.create(boardDto, user.userId);
    return this.mapper.toDto(entity);
  }

  @Get()
  async findBoards(@Query() query: FindBoardDto, @AuthUser() user: AuthUserDto) {
    const entities = await this.boardsService.findBy(query, user.userId);
    return entities.map(this.mapper.toDto);
  }

  @Get('/:id')
  async findBoard(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user: AuthUserDto) {
    const entity = await this.boardsService.findOne(id, user.userId);
    return this.mapper.toDto(entity);
  }

  @Patch('/:id')
  async updateBoard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBoardDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.boardsService.update(id, body, user.userId);
    return this.mapper.toDto(entity);
  }

  @Delete('/:id')
  async deleteBoard(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user: AuthUserDto) {
    await this.boardsService.remove(id, user.userId);
  }
}
