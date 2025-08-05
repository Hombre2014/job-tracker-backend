import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationSchedulerService {
  // Runs every 5 minutes
  @Cron('*/1 * * * *')
  handleCron() {
    console.log('NotificationSchedulerService.handleCron called');
  }
}
