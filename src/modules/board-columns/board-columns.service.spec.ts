import { BadRequestException } from '../../exceptions/bad-request.exception';
import { ConflictException } from '@nestjs/common';
import { BoardColumnsService } from './board-columns.service';
import { BoardColumn } from './entities/board-column.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { Board } from '../boards/entities/board.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('BoardColumnsService', () => {
  let service: BoardColumnsService;
  let repository: Repository<BoardColumn>;
  let boardRepository: Repository<Board>;

  const userId = 'user-1';
  const boardId = 'board-1';

  beforeEach(async () => {
    const boardColumnsRepositoryMock = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findBy: jest.fn(),
      upsert: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    const boardsRepositoryMock = {
      existsBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardColumnsService,
        { provide: getRepositoryToken(BoardColumn), useValue: boardColumnsRepositoryMock },
        { provide: getRepositoryToken(Board), useValue: boardsRepositoryMock },
      ],
    }).compile();
    service = module.get<BoardColumnsService>(BoardColumnsService);
    repository = module.get(getRepositoryToken(BoardColumn));
    boardRepository = module.get(getRepositoryToken(Board));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('throws BadRequestException when board does not exist', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(false);

      // Act & Assert
      await expect(service.create({ name: 'Col', boardId } as any, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(boardRepository.existsBy).toHaveBeenCalledWith({ id: boardId, user: { id: userId } });
    });

    it('throws ConflictException when column name already exists', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest
        .spyOn(repository, 'find')
        .mockResolvedValue([{ name: 'Col', order: 0 }] as BoardColumn[]);

      // Act & Assert
      await expect(service.create({ name: 'Col', boardId } as any, userId)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(repository.find).toHaveBeenCalled();
    });

    it('creates and saves a new column when data is valid', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const createdEntity = {
        id: 'col-1',
        name: 'Col',
        order: 0,
        board: { id: boardId },
      } as BoardColumn;
      jest.spyOn(repository, 'create').mockReturnValue(createdEntity);
      jest.spyOn(repository, 'save').mockResolvedValue(createdEntity);

      // Act
      const result = await service.create({ name: 'Col', boardId } as any, userId);

      // Assert
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Col',
        board: { id: boardId },
        order: 0,
      });
      expect(repository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toBe(createdEntity);
    });
  });

  describe('createDefaultBoardColumns', () => {
    it('throws BadRequestException when board does not exist', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(false);

      // Act & Assert
      await expect(service.createDefaultBoardColumns(boardId, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates and saves default columns when board exists', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);

      // Act
      await service.createDefaultBoardColumns(boardId, userId);

      // Assert
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('rearrangeColumns', () => {
    it('throws BadRequestException when board does not exist', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(false);
      const columnsIds = ['col-1', 'col-2'];

      // Act & Assert
      await expect(service.rearrangeColumns(boardId, columnsIds, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when provided list is empty', async () => {
      // Arrange
      const columnsIds = [];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);

      // Act & Assert
      await expect(service.rearrangeColumns(boardId, columnsIds, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when list has duplicates', async () => {
      // Arrange
      const columnsIds = ['col-1', 'col-1'];
      const existingColumns = [{ id: 'col-1' }, { id: 'col-2' }] as BoardColumn[];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'findBy').mockResolvedValue(existingColumns);

      // Act & Assert
      await expect(service.rearrangeColumns(boardId, columnsIds, userId)).rejects.toThrow(
        'List has duplicated Id.',
      );
    });

    it('throws BadRequestException when list does not match db columns', async () => {
      // Arrange
      const ctxColumns: any = ['col-1', 'random-col'];
      const dbColumns = [{ id: 'col-1' }, { id: 'col-2' }] as BoardColumn[];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'findBy').mockResolvedValue(dbColumns);

      // Act & Assert
      await expect(service.rearrangeColumns(boardId, ctxColumns, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('updates order and upserts when list is valid', async () => {
      // Arrange
      const ctxColumns: any = ['col-2', 'col-1'];
      const dbColumns = [
        { id: 'col-1', order: 0 },
        { id: 'col-2', order: 1 },
      ] as BoardColumn[];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'findBy').mockResolvedValue(dbColumns);

      // Act
      await service.rearrangeColumns(boardId, ctxColumns, userId);

      // Assert
      expect(repository.upsert).toHaveBeenCalledWith(expect.any(Array), ['id']);
    });
  });

  describe('update and remove (via findById)', () => {
    it('update assigns values and saves', async () => {
      // Arrange
      const columnId = 'col-1';
      const existing = { id: columnId, name: 'Old' } as BoardColumn;
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(existing);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...existing, name: 'New' } as BoardColumn);

      // Act
      const result = await service.update(columnId, { name: 'New' } as any, userId);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: columnId,
        board: { user: { id: userId } },
      });
      expect(repository.save).toHaveBeenCalledWith(existing);
      expect(result.name).toBe('New');
    });

    it('remove finds and removes the entity', async () => {
      // Arrange
      const columnId = 'col-2';
      const existing = { id: columnId, name: 'X' } as BoardColumn;
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(existing);
      jest.spyOn(repository, 'remove').mockResolvedValue(existing);

      // Act
      const result = await service.remove(columnId, userId);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: columnId,
        board: { user: { id: userId } },
      });
      expect(repository.remove).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
    });

    it('findById throws when not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('missing', { name: 'X' } as any, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
