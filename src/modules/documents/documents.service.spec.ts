import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';

type MockRepo = Partial<Record<string, jest.Mock>> & { [key: string]: jest.Mock };

function createMockRepo(): MockRepo {
  return {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    countBy: jest.fn(),
    remove: jest.fn(),
  };
}

describe('DocumentsService', () => {
  let documentsRepo: MockRepo;
  let usersRepo: MockRepo;
  let boardsRepo: MockRepo;
  let jobAppsRepo: MockRepo;
  let appwriteUploadsService: { uploadFile: jest.Mock };
  let service: DocumentsService;

  beforeEach(() => {
    documentsRepo = createMockRepo();
    usersRepo = createMockRepo();
    boardsRepo = createMockRepo();
    jobAppsRepo = createMockRepo();

    appwriteUploadsService = { uploadFile: jest.fn() };

    service = new DocumentsService(
      documentsRepo as any,
      appwriteUploadsService as any,
      usersRepo as any,
      boardsRepo as any,
      jobAppsRepo as any,
    );
  });

  afterEach(() => jest.resetAllMocks());

  it('create stores uploaded file and returns saved document (no board)', async () => {
    const file: any = { originalname: 'file.pdf', size: 1234 };
    const dto: CreateDocumentDto = { title: 'T', category: 0 } as any;

    (usersRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 'u1' });
    appwriteUploadsService.uploadFile.mockResolvedValue({ url: 'https://cdn/file.pdf' });
    (documentsRepo.create as jest.Mock).mockReturnValue({});
    (documentsRepo.save as jest.Mock).mockResolvedValue({ id: 'd1', url: 'https://cdn/file.pdf' });

    const res = await service.create(file, dto, 'u1');

    expect(usersRepo.findOneBy).toHaveBeenCalledWith({ id: 'u1' });
    expect(appwriteUploadsService.uploadFile).toHaveBeenCalledWith(file);
    expect(documentsRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'd1');
  });

  it('create handles boardId and attaches board', async () => {
    const file: any = { originalname: 'file.docx', size: 10 };
    const dto: any = { title: 'T', category: 0, boardId: 'b1' };

    (usersRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 'u1' });
    appwriteUploadsService.uploadFile.mockResolvedValue({ url: 'https://cdn/file.docx' });
    (boardsRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 'b1' });
    (documentsRepo.create as jest.Mock).mockReturnValue({});
    (documentsRepo.save as jest.Mock).mockResolvedValue({ id: 'd2', board: { id: 'b1' } });

    const res = await service.create(file, dto, 'u1');

    expect(boardsRepo.findOneBy).toHaveBeenCalledWith({ id: 'b1' });
    expect(res).toHaveProperty('id', 'd2');
  });

  it('findOneById returns document or throws NotFoundException', async () => {
    (documentsRepo.findOne as jest.Mock).mockResolvedValue({ id: 'd1' });

    const doc = await service.findOneById('d1', 'u1');
    expect(doc).toEqual({ id: 'd1' });

    (documentsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.findOneById('x', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('findAndPaginate returns items and total', async () => {
    const query: any = {
      sort: [{ by: 'createdAt', dir: 'desc' }],
      page: 1,
      take: 10,
      filter: { title: 'x' },
    };
    const items = [{ id: 'd1' }];
    (documentsRepo.find as jest.Mock).mockResolvedValue(items);
    (documentsRepo.countBy as jest.Mock).mockResolvedValue(42);

    const res = await service.findAndPaginate(query, 'u1');

    expect(documentsRepo.find).toHaveBeenCalled();
    expect(res).toMatchObject({ items, total: 42, page: 1, take: 10 });
  });

  it('attachDocumentToJobApplication attaches when both exist', async () => {
    const doc = { id: 'd1', jobApplications: [] } as any;
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(doc);
    (jobAppsRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 'ja1' });
    (documentsRepo.save as jest.Mock).mockResolvedValue({});

    await service.attachDocumentToJobApplication('d1', 'ja1', 'u1');

    expect(documentsRepo.findOne).toHaveBeenCalled();
    expect(jobAppsRepo.findOneBy).toHaveBeenCalledWith({
      id: 'ja1',
      column: { board: { user: { id: 'u1' } } },
    });
    expect(documentsRepo.save).toHaveBeenCalledWith(doc);
  });

  it('attachDocumentToJobApplication throws when document or job application missing', async () => {
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.attachDocumentToJobApplication('d1', 'ja1', 'u1')).rejects.toThrow(
      NotFoundException,
    );

    (documentsRepo.findOne as jest.Mock).mockResolvedValue({ id: 'd1', jobApplications: [] });
    (jobAppsRepo.findOneBy as jest.Mock).mockResolvedValue(null);
    await expect(service.attachDocumentToJobApplication('d1', 'ja1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('detachDocumentFromJobApplication removes relation or throws', async () => {
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.detachDocumentFromJobApplication('d1', 'ja1', 'u1')).rejects.toThrow(
      NotFoundException,
    );

    const doc = { id: 'd1', jobApplications: [{ id: 'ja1' }] } as any;
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(doc);
    (documentsRepo.save as jest.Mock).mockResolvedValue({});

    await service.detachDocumentFromJobApplication('d1', 'ja1', 'u1');
    expect(documentsRepo.save).toHaveBeenCalled();

    const doc2 = { id: 'd1', jobApplications: [{ id: 'other' }] } as any;
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(doc2);
    await expect(service.detachDocumentFromJobApplication('d1', 'ja1', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update updates fields and handles file upload', async () => {
    const existing = { id: 'd1', url: 'old' } as any;
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(existing);
    appwriteUploadsService.uploadFile.mockResolvedValue({ url: 'https://cdn/new' });
    (documentsRepo.save as jest.Mock).mockResolvedValue({ id: 'd1', url: 'https://cdn/new' });

    const file: any = { originalname: 'new.txt', size: 123 };

    const res = await service.update('d1', { title: 'New' } as UpdateDocumentDto, 'u1', file);

    expect(appwriteUploadsService.uploadFile).toHaveBeenCalledWith(file);
    expect(documentsRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'd1');
  });

  it('update and delete throw when document not found', async () => {
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.update('x', { title: 'X' } as any, 'u1')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.delete('x', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('delete removes document', async () => {
    const existing = { id: 'd1' } as any;
    (documentsRepo.findOne as jest.Mock).mockResolvedValue(existing);
    (documentsRepo.remove as jest.Mock).mockResolvedValue(existing);

    const res = await service.delete('d1', 'u1');
    expect(documentsRepo.remove).toHaveBeenCalledWith(existing);
    expect(res).toBe(existing);
  });

  it('getAllDocumentsPerBoard and getAllDocumentPerUser call repo find', () => {
    service.getAllDocumentsPerBoard('b1', 'u1');
    service.getAllDocumentPerUser('u1');

    expect(documentsRepo.find).toHaveBeenCalled();
  });
});
