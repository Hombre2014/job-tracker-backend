/* eslint-disable */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BoardColumnsService } from './board-columns.service';
import { BoardColumn } from './entities/board-column.entity';

describe('BoardColumnsService', () => {
  let service: BoardColumnsService;

  const mockBoardColumnsRepository: any = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findBy: jest.fn(),
    upsert: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockBoardsRepository: any = {
    existsBy: jest.fn(),
  };

  const userId = 'user-1';
  const boardId = 'board-1';

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BoardColumnsService(mockBoardColumnsRepository, mockBoardsRepository);
  });

  describe('create', () => {
    it('throws BadRequestException when board does not exist', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(false);

      await expect(
        service.create({ name: 'Col', boardId } as any, userId),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mockBoardsRepository.existsBy).toHaveBeenCalledWith({ id: boardId, user: { id: userId } });
    });

    it('throws ConflictException when column name already exists', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);
      // return one existing column with same name
      mockBoardColumnsRepository.find.mockResolvedValue([{ name: 'Col', order: 0 }]);

      await expect(
        service.create({ name: 'Col', boardId } as any, userId),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockBoardColumnsRepository.find).toHaveBeenCalled();
    });

    it('creates and saves a new column when data is valid', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);
      mockBoardColumnsRepository.find.mockResolvedValue([]);

      const createdEntity = { id: 'col-1', name: 'Col', order: 0, board: { id: boardId } } as BoardColumn;
      mockBoardColumnsRepository.create.mockReturnValue(createdEntity);
      mockBoardColumnsRepository.save.mockResolvedValue(createdEntity);

      const result = await service.create({ name: 'Col', boardId } as any, userId);

      expect(mockBoardColumnsRepository.create).toHaveBeenCalledWith({ name: 'Col', board: { id: boardId }, order: 0 });
      expect(mockBoardColumnsRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toBe(createdEntity);
    });
  });

  describe('createDefaultBoardColumns', () => {
    it('throws BadRequestException when board does not exist', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(false);

      await expect(service.createDefaultBoardColumns(boardId, userId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates and saves default columns when board exists', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);

      const saved = [
        { id: '1', name: 'Wishlist' },
        { id: '2', name: 'Applied' },
      ] as BoardColumn[];
      mockBoardColumnsRepository.create.mockImplementation((v) => v);
      mockBoardColumnsRepository.save.mockResolvedValue(saved);

      const result = await service.createDefaultBoardColumns(boardId, userId);

      expect(mockBoardColumnsRepository.create).toHaveBeenCalled();
      expect(mockBoardColumnsRepository.save).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toBe(saved);
    });
  });

  describe('rearrangeColumns', () => {
    it('throws BadRequestException when board does not exist', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(false);
      const columnsIds = ['col-1', 'col-2'];
      await expect(service.rearrangeColumns(boardId, columnsIds, userId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when provided list is empty', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);

      const columnsIds = [];

      await expect(service.rearrangeColumns(boardId, columnsIds, userId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when list has duplicates', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);

      const columnsIds = ['col-1', 'col-2'];

      await expect(service.rearrangeColumns(boardId, columnsIds, userId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when list does not match db columns', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);

      const dbColumns = [{ id: 'col-1' }, { id: 'col-2' }];
      mockBoardColumnsRepository.findBy.mockResolvedValue(dbColumns);

      const ctxColumns: any = ['col-1', 'random-col'];

      await expect(service.rearrangeColumns(boardId, ctxColumns, userId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates order and upserts when list is valid', async () => {
      mockBoardsRepository.existsBy.mockResolvedValue(true);

      const dbColumns = [{ id: 'col-1', order: 0 }, { id: 'col-2', order: 1 }];
      mockBoardColumnsRepository.findBy.mockResolvedValue(dbColumns);

      const ctxColumns: any = ['col-2', 'col-1'];

      await service.rearrangeColumns(boardId, ctxColumns, userId);

      // After rearrange, orders should be updated and upsert called
      expect(mockBoardColumnsRepository.upsert).toHaveBeenCalledWith(expect.any(Array), ['id']);
    });
  });

  describe('update and remove (via findById)', () => {
    it('update assigns values and saves', async () => {
      const columnId = 'col-1';
      const existing = { id: columnId, name: 'Old' };
      mockBoardColumnsRepository.findOneBy.mockResolvedValue(existing);
      mockBoardColumnsRepository.save.mockResolvedValue({ ...existing, name: 'New' });

      const result = await service.update(columnId, { name: 'New' } as any, userId);

      expect(mockBoardColumnsRepository.findOneBy).toHaveBeenCalledWith({ id: columnId, board: { user: { id: userId } } });
      expect(mockBoardColumnsRepository.save).toHaveBeenCalledWith(existing);
      expect(result.name).toBe('New');
    });

    it('remove finds and removes the entity', async () => {
      const columnId = 'col-2';
      const existing = { id: columnId, name: 'X' };
      mockBoardColumnsRepository.findOneBy.mockResolvedValue(existing);
      mockBoardColumnsRepository.remove.mockResolvedValue(existing);

      const result = await service.remove(columnId, userId);

      expect(mockBoardColumnsRepository.findOneBy).toHaveBeenCalledWith({ id: columnId, board: { user: { id: userId } } });
      expect(mockBoardColumnsRepository.remove).toHaveBeenCalledWith(existing);
      expect(result).toBe(existing);
    });

    it('findById throws when not found', async () => {
      mockBoardColumnsRepository.findOneBy.mockResolvedValue(undefined);

      await expect(service.update('missing', { name: 'X' } as any, userId)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
