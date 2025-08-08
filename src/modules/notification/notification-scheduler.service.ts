import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { DayOfWeekEnum, DayOfWeekType } from './enums/day-of-week.enum';
import { Board } from '../boards/entities/board.entity';
import { EmailSenderService } from '../email-sender/email-sender.service';
import { JobApplication } from '../job-applications/entities/job-application.entity';

@Injectable()
export class NotificationSchedulerService {
  constructor(
    private readonly emailSenderService: EmailSenderService,
    @InjectRepository(NotificationSchedule)
    private readonly notificationRepository: Repository<NotificationSchedule>,
  ) {}

  // Runs every minute
  @Cron('*/1 * * * *')
  async handleCron() {
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000 * 999999);
    const notificationsToSend = await this.notificationRepository.find({
      where: { scheduledTime: Between(tenMinAgo, now) },
      relations: { user: { board: { columns: { jobApplications: { company: true } } } } },
    });
    for (const setting of notificationsToSend) {
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

  generateJobsHtmlPage(board: Board): string {
    const jobs = board.columns.flatMap((column) => column.jobApplications);
    // Group jobs by status
    const statusMap: Record<string, Array<JobApplication>> = {};
    const jobsWithDeadline: Array<JobApplication> = [];
    for (const job of jobs) {
      if (job.deadline) {
        jobsWithDeadline.push(job);
      }
      if (!statusMap[job.status]) {
        statusMap[job.status] = [];
      }
      statusMap[job.status].push(job);
    }

    // Updated styles for new design
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; background: #f9f9f9; color: #222; }
        h2 { margin-top: 32px; color: #2a4d7c; }
        .card { border: 1px solid #e2e2e2; border-radius: 12px; background: #fff; margin: 32px 0; padding: 24px; }
        .table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .table th, .table td { padding: 0; border: none; }
        .status-cell { background: #FFD36A; color: #fff; font-weight: bold; padding: 12px 24px; border-radius: 4px; font-size: 1rem; text-align: left; width: 180px; }
        .job-title { font-weight: bold; color: #2a1859; font-size: 1.2rem; }
        .company-salary { color: #7B6F9E; font-size: 1rem; margin-top: 4px; }
        .deadline-cell { color: #E25A5A; font-weight: bold; font-size: 1.1rem; text-align: right; width: 180px; }
        .row { height: 64px; }
      </style>
    `;

    // Helper to format date
    const formatDate = (date: Date | string | undefined) => {
      if (!date) {
        return '';
      }
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    // Table for jobs with deadline
    let html = `<html><head>${styles}</head><body>`;
    if (jobsWithDeadline.length) {
      html += `<h2>Past Due Activities</h2><div class="card"><table class="table"><tbody>`;
      for (const job of jobsWithDeadline) {
        html += `
          <tr class="row">
            <td class="status-cell">${job.status}</td>
            <td style="padding-left:32px;">
              <div class="job-title">${job.title}</div>
              <div class="company-salary">${job.company?.name || ''}${job.salary ? ' - ' + job.salary : ''}</div>
            </td>
            <td class="deadline-cell">${formatDate(job.deadline)}</td>
          </tr>
        `;
      }
      html += `</tbody></table></div>`;
    }

    // Tables per status (similar design, no status column)
    for (const status of Object.keys(statusMap)) {
      html += `<h2>${status} Jobs</h2><div class="card"><table class="table"><tbody>`;
      for (const job of statusMap[status]) {
        html += `
          <tr class="row">
            <td style="padding-left:0;">
              <div class="job-title">${job.title}</div>
              <div class="company-salary">${job.company?.name || ''}${job.salary ? ' - ' + job.salary : ''}</div>
            </td>
            <td class="deadline-cell">${job.updatedAt ? formatDate(job.updatedAt) : ''}</td>
          </tr>
        `;
      }
      html += `</tbody></table></div>`;
    }
    html += `</body></html>`;
    return html;
  }
}
