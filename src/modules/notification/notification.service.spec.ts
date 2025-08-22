import { ConflictException, NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayOfWeekEnum } from './enums/day-of-week.enum';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: Repository<NotificationSchedule>;
  let scheduler: NotificationSchedulerService;

  const validDailyNotification = {
    id: '52d49f16-4981-4f43-ab4e-3281f732cdd6',
    user: {
      id: '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b',
    },
    time: '09:00',
    type: ReportNotificationEnum.DAILY,
    timezoneOffset: 0,
    scheduledTime: new Date('2025-01-01T09:00:00Z'),
  } as NotificationSchedule;

  const validWeeklyNotification = {
    id: '52d49f16-4981-4f43-ab4e-3281f732cdd6',
    user: {
      id: '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b',
    },
    time: '10:00',
    dayOfWeek: DayOfWeekEnum.MONDAY,
    type: ReportNotificationEnum.WEEKLY,
    timezoneOffset: -60,
    scheduledTime: new Date('2025-01-01T10:00:00Z'),
  } as NotificationSchedule;

  beforeEach(async () => {
    const repositoryMock = {
      findBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    const schedulerMock = {
      calculateNextNotificationTime: jest.fn().mockReturnValue(new Date('2025-01-01T00:00:00Z')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(NotificationSchedule), useValue: repositoryMock },
        { provide: NotificationSchedulerService, useValue: schedulerMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get(getRepositoryToken(NotificationSchedule));
    scheduler = module.get<NotificationSchedulerService>(NotificationSchedulerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createDailyNotification', () => {
    it('creates daily notification and calls scheduler with correct entity', async () => {
      // Arrange
      const dto: CreateDailyNotification = { time: '09:00', timezoneOffset: 0 } as any;
      jest.spyOn(repository, 'create').mockReturnValue(validDailyNotification);
      jest.spyOn(repository, 'save').mockResolvedValue(validDailyNotification);

      // Act
      await service.createDailyNotification(dto, validDailyNotification.user.id);

      // Assert
      expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledTimes(1);
      expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: validDailyNotification.user.id },
          type: ReportNotificationEnum.DAILY,
          time: dto.time,
          timezoneOffset: dto.timezoneOffset,
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          time: dto.time,
          timezoneOffset: dto.timezoneOffset,
        }),
      );
    });

    it('throws ConflictException when save unique constraint violation occurs', async () => {
      // Arrange
      const dto: CreateDailyNotification = { time: '09:00', timezoneOffset: 0 } as any;
      jest.spyOn(repository, 'create').mockReturnValue(validDailyNotification);
      const error: any = new Error('duplicate');
      error.code = '23505';
      jest.spyOn(repository, 'save').mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.createDailyNotification(dto, validDailyNotification.user.id),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createWeeklyNotification', () => {
    it('creates weekly notification and calls scheduler with dayOfWeek', async () => {
      // Arrange
      const dto: CreateWeeklyNotification = {
        time: '10:00',
        timezoneOffset: -60,
        dayOfWeek: DayOfWeekEnum.MONDAY,
      } as any;
      jest.spyOn(repository, 'create').mockReturnValue(validWeeklyNotification);
      jest.spyOn(repository, 'save').mockResolvedValue(validWeeklyNotification);

      // Act
      await service.createWeeklyNotification(dto, validWeeklyNotification.user.id);

      // Assert
      expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledTimes(1);
      expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: validWeeklyNotification.user.id },
          type: ReportNotificationEnum.WEEKLY,
          time: dto.time,
          dayOfWeek: dto.dayOfWeek,
          timezoneOffset: dto.timezoneOffset,
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          time: dto.time,
          timezoneOffset: dto.timezoneOffset,
        }),
      );
    });
  });

  describe('updateDailyNotification', () => {
    it('throws NotFoundException when updating non-existing notification', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateDailyNotification(
          { time: '09:00', timezoneOffset: 0 } as CreateDailyNotification,
          '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
      expect(scheduler.calculateNextNotificationTime).not.toHaveBeenCalled();
    });

    it('updates notification and calls scheduler with updated entity', async () => {
      // Arrange
      jest
        .spyOn(repository, 'findOne')
        .mockReturnValue(Promise.resolve(validDailyNotification as any));
      jest.spyOn(repository, 'save').mockResolvedValue(validDailyNotification);
      const dto = { time: '11:00', timezoneOffset: 60 } as CreateDailyNotification;

      // Act
      await service.updateDailyNotification(dto, validDailyNotification.user.id);

      // Assert
      expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: validDailyNotification.user.id },
          time: dto.time,
          timezoneOffset: dto.timezoneOffset,
          type: ReportNotificationEnum.DAILY,
        }),
      );
    });
  });

  describe('getBothNotifications', () => {
    it('getBothNotifications returns daily and weekly correctly', async () => {
      // Arrange
      jest
        .spyOn(repository, 'findBy')
        .mockResolvedValue([validDailyNotification, validWeeklyNotification]);

      // Act
      const res = await service.getBothNotifications('u');
      expect(res.daily).toBe(validDailyNotification);
      expect(res.weekly).toBe(validWeeklyNotification);
    });
  });

  describe('updateBothNotifications', () => {
    it('updateBothNotifications creates missing notifications and calls scheduler twice', async () => {
      // Arrange
      jest.spyOn(repository, 'findBy').mockResolvedValue([]);
      // Return daily notification even for weekly time Create and Save
      jest.spyOn(repository, 'create').mockReturnValue(validDailyNotification);
      jest.spyOn(repository, 'save').mockReturnValue(Promise.resolve(validDailyNotification));

      const dto = {
        daily: { time: '09:00', timezoneOffset: 0 },
        weekly: { time: '10:00', timezoneOffset: 0, dayOfWeek: 2 },
      } as any;

      // Act
      const res = await service.updateBothNotifications(dto, validDailyNotification.user.id);

      // Assert
      expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledTimes(2);
      expect(res.daily).toBeDefined();
      expect(res.weekly).toBeDefined();
    });
  });
});
