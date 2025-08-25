import { BadRequestException } from '../../exceptions/bad-request.exception';
import { ConflictException } from '@nestjs/common';
import { BoardColumnsService } from './board-columns.service';
import { BoardColumn } from './entities/board-column.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { Board } from '../boards/entities/board.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { newGuid } from '../../utils/guid';

describe('BoardColumnsService', () => {
  let service: BoardColumnsService;
  let repository: Repository<BoardColumn>;
  let boardRepository: Repository<Board>;

  const userId = 'user-1';
  const boardId = 'board-1';
  const columnId = 'c010000-77a5-446e-bc84-9531bf312f9b';
  const validColumn = {
    id: columnId,
    name: 'Test Column',
    order: 0,
    board: { id: boardId },
  } as BoardColumn;

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
      jest.spyOn(repository, 'find').mockResolvedValue([validColumn] as BoardColumn[]);

      // Act & Assert
      await expect(
        service.create({ name: validColumn.name, boardId } as any, userId),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.find).toHaveBeenCalled();
    });

    it('creates and saves a new column when data is valid', async () => {
      // Arrange
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'find').mockResolvedValue([]);
      jest.spyOn(repository, 'create').mockReturnValue(validColumn);
      jest.spyOn(repository, 'save').mockResolvedValue(validColumn);

      // Act
      const result = await service.create({ name: validColumn.name, boardId } as any, userId);

      // Assert
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBe(validColumn);
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
      const columnsIds = [newGuid(), newGuid()];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(false);

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
      const existingColumns = [{ id: newGuid() }, { id: newGuid() }] as BoardColumn[];
      const duplicatedColumns = [existingColumns[0].id, existingColumns[0].id];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'findBy').mockResolvedValue(existingColumns);

      // Act & Assert
      await expect(service.rearrangeColumns(boardId, duplicatedColumns, userId)).rejects.toThrow(
        'List has duplicated Id.',
      );
    });

    it('throws BadRequestException when list does not match db columns', async () => {
      // Arrange
      const existingColumns = [{ id: newGuid() }, { id: newGuid() }] as BoardColumn[];
      const invalidColumn = [existingColumns[0].id, newGuid()];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'findBy').mockResolvedValue(existingColumns);

      // Act & Assert
      await expect(service.rearrangeColumns(boardId, invalidColumn, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('updates order and upserts when list is valid', async () => {
      // Arrange
      const existingColumns = [
        { id: newGuid(), order: 0 },
        { id: newGuid(), order: 1 },
      ] as BoardColumn[];
      const validColumns = [existingColumns[1].id, existingColumns[0].id];
      jest.spyOn(boardRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(repository, 'findBy').mockResolvedValue(existingColumns);

      // Act
      await service.rearrangeColumns(boardId, validColumns, userId);

      // Assert
      expect(repository.upsert).toHaveBeenCalledWith(expect.any(Array), ['id']);
    });
  });

  describe('update and remove (via findById)', () => {
    it('update assigns values and saves', async () => {
      // Arrange
      const columnId = newGuid();
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
      const columnId = newGuid();
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
