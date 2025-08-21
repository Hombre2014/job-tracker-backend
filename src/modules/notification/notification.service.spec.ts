import { ConflictException, NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: any;
  let scheduler: any;

  beforeEach(() => {
    repo = {
      findBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    scheduler = {
      calculateNextNotificationTime: jest.fn().mockReturnValue(new Date('2025-01-01T00:00:00Z')),
    };
    service = new NotificationService(repo as any, scheduler as any);
  });

  it('creates daily notification and calls scheduler with correct entity', async () => {
    const dto: CreateDailyNotification = { time: '09:00', timezoneOffset: 0 } as any;
    repo.create.mockImplementation((obj: any) => ({ id: 'd1', ...obj }));
    repo.save.mockResolvedValue({ id: 'saved1' });

    const result = await service.createDailyNotification(dto, 'user_id');

    expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledTimes(1);
    const calledWith = scheduler.calculateNextNotificationTime.mock.calls[0][0];
    expect(calledWith.user).toEqual({ id: 'user_id' });
    expect(calledWith.type).toEqual(ReportNotificationEnum.DAILY);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        time: '09:00',
        timezoneOffset: 0,
      }),
    );
    expect(result.id).toBe('saved1');
  });

  it('creates weekly notification and calls scheduler with dayOfWeek', async () => {
    const dto: CreateWeeklyNotification = {
      time: '10:00',
      timezoneOffset: -60,
      dayOfWeek: 1,
    } as any;
    repo.create.mockImplementation((obj: any) => ({ id: 'w1', ...obj }));
    repo.save.mockResolvedValue({ id: 'savedW' });

    const result = await service.createWeeklyNotification(dto, 'user_id');

    expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledTimes(1);
    const calledWith = scheduler.calculateNextNotificationTime.mock.calls[0][0];
    expect(calledWith.dayOfWeek).toBe(1);
    expect(calledWith.type).toEqual(ReportNotificationEnum.WEEKLY);
    expect(result.id).toBe('savedW');
  });

  it('throws ConflictException when save unique constraint violation occurs', async () => {
    const dto: CreateDailyNotification = { time: '09:00', timezoneOffset: 0 } as any;
    repo.create.mockImplementation((obj: any) => ({ ...obj }));
    const err: any = new Error('duplicate');
    err.code = '23505';
    repo.save.mockRejectedValue(err);

    await expect(service.createDailyNotification(dto, 'user_id')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws NotFoundException when updating non-existing notification', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(
      service.updateDailyNotification({ time: '09:00', timezoneOffset: 0 } as any, 'u'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates notification and calls scheduler with updated entity', async () => {
    const existing = {
      id: 'n1',
      user: { id: 'u' },
      type: ReportNotificationEnum.DAILY,
      time: '08:00',
      timezoneOffset: 0,
    };
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockImplementation(async (e: any) => ({ ...e, id: 'n1' }));
    const dto = { time: '11:00', timezoneOffset: 60 } as any;

    const res = await service.updateDailyNotification(dto, 'user_id');

    expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 'u' },
        time: '11:00',
      }),
    );
    expect(res.id).toBe('n1');
  });

  it('throws NotFoundException when deleting non-existing notification', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.deleteDailyNotification('u')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getBothNotifications returns daily and weekly correctly', async () => {
    const daily = { id: 'd', type: ReportNotificationEnum.DAILY } as any;
    const weekly = { id: 'w', type: ReportNotificationEnum.WEEKLY } as any;
    repo.findBy.mockResolvedValue([daily, weekly]);

    const res = await service.getBothNotifications('u');
    expect(res.daily).toBe(daily);
    expect(res.weekly).toBe(weekly);
  });

  it('updateBothNotifications creates missing notifications and calls scheduler twice', async () => {
    repo.findBy.mockResolvedValue([]);
    repo.create.mockImplementation((obj: any) => ({ ...obj }));
    repo.save.mockResolvedValue({ id: 'saved' });
    const dto = {
      daily: { time: '09:00', timezoneOffset: 0 },
      weekly: { time: '10:00', timezoneOffset: 0, dayOfWeek: 2 },
    } as any;

    const res = await service.updateBothNotifications(dto, 'user_id');

    expect(scheduler.calculateNextNotificationTime).toHaveBeenCalledTimes(2);
    expect(res.daily).toBeDefined();
    expect(res.weekly).toBeDefined();
  });
});
