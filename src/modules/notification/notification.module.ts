import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([NotificationSchedule])],
  controllers: [NotificationController],
  providers: [NotificationSchedulerService, NotificationService],
})
export class NotificationModule {}
