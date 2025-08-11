import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationSchedule)
    private readonly notificationRepository: Repository<NotificationSchedule>,
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  async createDailyNotification(notification: CreateDailyNotification, userId: string) {
    return this.createNotification(notification, ReportNotificationEnum.DAILY, userId);
  }

  async createWeeklyNotification(notification: CreateWeeklyNotification, userId: string) {
    return this.createNotification(notification, ReportNotificationEnum.WEEKLY, userId);
  }

  private async createNotification(
    notification: CreateDailyNotification | CreateWeeklyNotification,
    type: ReportNotificationEnum,
    userId: string,
  ) {
    const existingNotification = await this.notificationRepository.existsBy({
      user: { id: userId },
      type,
    });

    if (existingNotification) {
      throw new ConflictException(`${type} notification already exists for this user`);
    }

    const entity = this.notificationRepository.create({
      user: { id: userId },
      time: notification.time,
      timezoneOffset: notification.timezoneOffset,
      type,
      ...(type === ReportNotificationEnum.WEEKLY &&
        'dayOfWeek' in notification && { dayOfWeek: notification.dayOfWeek }),
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
    return this.updateNotification(notification, ReportNotificationEnum.DAILY, userId);
  }

  async updateWeeklyNotification(notification: CreateWeeklyNotification, userId: string) {
    return this.updateNotification(notification, ReportNotificationEnum.WEEKLY, userId);
  }

  async updateNotification(
    notification: CreateDailyNotification | CreateWeeklyNotification,
    type: ReportNotificationEnum,
    userId: string,
  ) {
    const entity = await this.notificationRepository.findOne({
      where: { user: { id: userId }, type },
    });
    if (!entity) {
      throw new NotFoundException(`${type} notification not found`);
    }

    Object.assign(entity, notification);
    entity.scheduledTime = this.schedulerService.calculateNextNotificationTime(entity);
    return this.notificationRepository.save(entity);
  }

  async deleteDailyNotification(userId: string) {
    await this.deleteNotification(ReportNotificationEnum.DAILY, userId);
  }

  async deleteWeeklyNotification(userId: string) {
    await this.deleteNotification(ReportNotificationEnum.WEEKLY, userId);
  }

  private async deleteNotification(type: ReportNotificationEnum, userId: string) {
    const result = await this.notificationRepository.delete({
      user: { id: userId },
      type,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`${type} notification not found`);
    }
  }
}
