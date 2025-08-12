import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { UpdateNotification } from './dtos/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationSchedule)
    private readonly notificationRepository: Repository<NotificationSchedule>,
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  async getBothNotifications(userId: string) {
    const notifications = await this.notificationRepository.findBy({
      user: { id: userId },
    });
    return {
      daily: notifications.find((n) => n.type === ReportNotificationEnum.DAILY) ?? null,
      weekly: notifications.find((n) => n.type === ReportNotificationEnum.WEEKLY) ?? null,
    };
  }

  async updateBothNotifications(notificationDto: UpdateNotification, userId: string) {
    const notifications = await this.getBothNotifications(userId);
    const result = { daily: null, weekly: null };
    if (notifications.daily == null && notificationDto.daily != null) {
      result.daily = await this.createDailyNotification(notificationDto.daily, userId);
    } else if (notifications.daily != null && notificationDto.daily != null) {
      result.daily = await this.updateDailyNotification(notificationDto.daily, userId);
    } else if (notifications.daily != null && notificationDto.daily == null) {
      await this.deleteDailyNotification(userId);
    }
    if (notifications.weekly == null && notificationDto.weekly != null) {
      result.weekly = await this.createWeeklyNotification(notificationDto.weekly, userId);
    } else if (notifications.weekly != null && notificationDto.weekly != null) {
      result.weekly = await this.updateWeeklyNotification(notificationDto.weekly, userId);
    } else if (notifications.weekly != null && notificationDto.weekly == null) {
      await this.deleteWeeklyNotification(userId);
    }
    return result;
  }

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
    const entity = this.notificationRepository.create({
      user: { id: userId },
      time: notification.time,
      timezoneOffset: notification.timezoneOffset,
      type,
      ...(type === ReportNotificationEnum.WEEKLY &&
        'dayOfWeek' in notification && { dayOfWeek: notification.dayOfWeek }),
    });

    entity.scheduledTime = this.schedulerService.calculateNextNotificationTime(entity);
    try {
      return await this.notificationRepository.save(entity);
    } catch (e: any) {
      // Postgres unique_violation
      if (e?.code === '23505') {
        throw new ConflictException(`${type} notification already exists for this user`);
      }
      throw e;
    }
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
