import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Module({ imports: [ScheduleModule.forRoot()], providers: [NotificationSchedulerService] })
export class NotificationModule {}
