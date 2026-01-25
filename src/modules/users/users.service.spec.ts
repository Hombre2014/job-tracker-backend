import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BoardsService } from '../boards/boards.service';
import { UserCodeVerificationService } from './user-code-verification.service';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from './enums/user-role.enum';
import { AppwriteUploadsService } from '../appwrite-uploads/appwrite-uploads.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let userCodeVerificationServiceMock: UserCodeVerificationService;
  let dataSourceMock: any;

  const validUser = {
    id: '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b',
    email: 'user@email.com',
    role: UserRole.USER,
    documents: [],
  } as User;

  beforeEach(async () => {
    const repositoryMock = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(validUser)),
      findOneBy: jest.fn().mockImplementation(() => Promise.resolve(validUser)),
      save: jest.fn().mockImplementation(() => Promise.resolve(validUser)),
      remove: jest.fn().mockImplementation(() => Promise.resolve(validUser)),
    };

    const appwriteMock = {
      uploadFile: jest.fn().mockImplementation(() => Promise.resolve()),
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn(),
          remove: jest.fn(),
        },
      }),
      transaction: jest.fn((callback) => {
        const mockManager = {
          save: jest.fn().mockResolvedValue({}),
          remove: jest.fn().mockResolvedValue({}),
          findOne: jest.fn(),
        };
        return callback(mockManager);
      }),
    };

    const repositoryToken = getRepositoryToken(User);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DataSource, useValue: dataSourceMock },
        { provide: repositoryToken, useValue: repositoryMock },
        { provide: UserCodeVerificationService, useValue: { verifyUserCode: jest.fn() } },
        { provide: BoardsService, useValue: {} },
        { provide: AppwriteUploadsService, useValue: appwriteMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userCodeVerificationServiceMock = module.get<UserCodeVerificationService>(
      UserCodeVerificationService,
    );
    repository = module.get<Repository<User>>(repositoryToken);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user', async () => {
    // Act & Assert
    expect(await service.findOneBy({ email: validUser.email })).toEqual({
      id: validUser.id,
      email: validUser.email,
      role: validUser.role,
      documents: [],
    });
  });

  it('should throw NotFoundException', async () => {
    // Arrange
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    // Act & Assert
    await expect(service.findOneBy({ email: 'user@email.com' })).rejects.toThrow(NotFoundException);
  });

  it('should update user', async () => {
    // Act
    await service.update(
      validUser.id,
      {
        role: UserRole.ADMIN,
        profilePicUrl: null,
      },
      null,
    );

    // Assert
    expect(repository.save).toHaveBeenCalledWith({ ...validUser, role: UserRole.ADMIN });
  });

  it('should delete user', async () => {
    // Act
    await service.remove(validUser.id, 'code');

    // Assert
    // Delete now uses dataSource.transaction with manager.remove
    expect(dataSourceMock.transaction).toHaveBeenCalled();
  });

  it('should throw exception on delete user', async () => {
    // Arrange
    jest
      .spyOn(userCodeVerificationServiceMock, 'verifyUserCode')
      .mockImplementation(() => Promise.reject(new Error('unit test error')));

    // Act & Assert
    await expect(service.remove(validUser.id, 'some code')).rejects.toThrow();
    expect(repository.remove).toHaveBeenCalledTimes(0);
  });
});
