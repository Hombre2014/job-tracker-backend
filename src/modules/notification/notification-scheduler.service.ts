import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { DayOfWeekEnum, DayOfWeekType } from './enums/day-of-week.enum';

@Injectable()
export class NotificationSchedulerService {
  constructor(
    @InjectRepository(NotificationSchedule)
    private readonly notificationRepository: Repository<NotificationSchedule>,
  ) {}

  // Runs every minute
  @Cron('*/1 * * * *')
  async handleCron() {
    const settings = await this.notificationRepository.find({ relations: ['user'] });
    for (const setting of settings) {
      const nextTime = this.calculateNextNotificationTime(setting);
      console.error(
        `Next notification for user ${setting.user.id} (type: ${setting.type}): ${nextTime.toISOString()}`,
      );
    }
  }

  // Runs every hour
  @Cron('0 */1 * * *')
  async rescheduleExpiredNotifications() {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    await this.notificationRepository
      .findBy({
        scheduledTime: LessThan(dayAgo),
      })
      .then((notifications) => {
        notifications.forEach(async (notification) => {
          notification.scheduledTime = this.calculateNextNotificationTime(notification);
          await this.notificationRepository.save(notification);
          console.warn(`Rescheduled expired notification id: ${notification.id}`);
        });
      });
  }

  calculateNextNotificationTime(setting: NotificationSchedule): Date {
    const [hours, minutes] = setting.time.split(':').map(Number);
    const now = new Date();
    const localDate = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes),
    );

    if (setting.type === ReportNotificationEnum.DAILY) {
      if (localDate <= now) {
        // If time has passed today, schedule for tomorrow
        localDate.setDate(localDate.getDate() + 1);
      }
    } else if (setting.type === ReportNotificationEnum.WEEKLY) {
      const targetDay = this.dayOfWeekMap(setting.dayOfWeek);
      let daysToAdd = (targetDay - localDate.getDay() + 7) % 7;
      if (daysToAdd === 0 && localDate <= now) {
        daysToAdd = 7;
      }
      localDate.setDate(localDate.getDate() + daysToAdd);
    }

    // Adjust by timezoneOffset (in minutes) to get UTC time
    const utcMs = localDate.getTime() + setting.timezoneOffset * 60_000;
    return new Date(utcMs);
  }

  private dayOfWeekMap(day: DayOfWeekType): number {
    switch (day) {
      case DayOfWeekEnum.SUNDAY:
        return 0;
      case DayOfWeekEnum.MONDAY:
        return 1;
      case DayOfWeekEnum.TUESDAY:
        return 2;
      case DayOfWeekEnum.WEDNESDAY:
        return 3;
      case DayOfWeekEnum.THURSDAY:
        return 4;
      case DayOfWeekEnum.FRIDAY:
        return 5;
      case DayOfWeekEnum.SATURDAY:
        return 6;
      default:
        return 0;
    }
  }
}
