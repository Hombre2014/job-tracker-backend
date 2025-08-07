import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { NotificationAlreadyExistsException } from './exceptions/norification-exists.exception';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationSchedule)
    private readonly notificationRepository: Repository<NotificationSchedule>,
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  async createDailyNotification(notification: CreateDailyNotification, userId: string) {
    const existingNotification = await this.notificationRepository.existsBy({
      user: { id: userId },
      type: ReportNotificationEnum.DAILY,
    });

    if (existingNotification) {
      throw new NotificationAlreadyExistsException(
        'Daily notification already exists for this user',
      );
    }

    const entity = this.notificationRepository.create({
      user: { id: userId },
      time: notification.time,
      timezoneOffset: notification.timezoneOffset,
      type: ReportNotificationEnum.DAILY,
    });

    entity.scheduledTime = this.schedulerService.calculateNextNotificationTime(entity);

    return this.notificationRepository.save(entity);
  }

  async createWeeklyNotification(notification: CreateWeeklyNotification, userId: string) {
    const existingNotification = await this.notificationRepository.existsBy({
      user: { id: userId },
      type: ReportNotificationEnum.WEEKLY,
    });

    if (existingNotification) {
      throw new NotificationAlreadyExistsException(
        'Weekly notification already exists for this user',
      );
    }

    const entity = this.notificationRepository.create({
      user: { id: userId },
      time: notification.time,
      timezoneOffset: notification.timezoneOffset,
      dayOfWeek: notification.dayOfWeek,
      type: ReportNotificationEnum.WEEKLY,
    });

    entity.scheduledTime = this.schedulerService.calculateNextNotificationTime(entity);

    return this.notificationRepository.save(entity);
  }

  async getDailyNotification(userId: string) {
    return this.notificationRepository.findOne({
      where: { user: { id: userId }, type: ReportNotificationEnum.DAILY },
    });
  }

  async getWeeklyNotification(userId: string) {
    return this.notificationRepository.findOne({
      where: { user: { id: userId }, type: ReportNotificationEnum.WEEKLY },
    });
  }

  async updateDailyNotification(notification: CreateDailyNotification, userId: string) {
    const entity = await this.notificationRepository.findOne({
      where: { user: { id: userId }, type: ReportNotificationEnum.DAILY },
    });
    if (!entity) {
      throw new NotFoundException('Daily notification not found');
    }
    entity.time = notification.time;
    entity.timezoneOffset = notification.timezoneOffset;
    entity.scheduledTime = this.schedulerService.calculateNextNotificationTime(entity);
    return this.notificationRepository.save(entity);
  }

  async updateWeeklyNotification(notification: CreateWeeklyNotification, userId: string) {
    const entity = await this.notificationRepository.findOne({
      where: { user: { id: userId }, type: ReportNotificationEnum.WEEKLY },
    });
    if (!entity) {
      throw new NotFoundException('Weekly notification not found');
    }
    entity.time = notification.time;
    entity.dayOfWeek = notification.dayOfWeek;
    entity.timezoneOffset = notification.timezoneOffset;
    entity.scheduledTime = this.schedulerService.calculateNextNotificationTime(entity);
    return this.notificationRepository.save(entity);
  }

  async deleteDailyNotification(userId: string) {
    const result = await this.notificationRepository.delete({
      user: { id: userId },
      type: ReportNotificationEnum.DAILY,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Daily notification not found');
    }
    return true;
  }

  async deleteWeeklyNotification(userId: string) {
    const result = await this.notificationRepository.delete({
      user: { id: userId },
      type: ReportNotificationEnum.WEEKLY,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Weekly notification not found');
    }
    return true;
  }
}
