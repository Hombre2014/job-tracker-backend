import { Body, Controller, Delete, Post, Put } from '@nestjs/common';
import { AuthUser } from '../auth/user.decorator';
import { NotificationService } from './notification.service';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('daily-report')
  createDailyNotification(
    @Body() notification: CreateDailyNotification,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.notificationService.createDailyNotification(notification, user.userId);
  }

  @Post('weekly-report')
  createWeeklyNotification(
    @Body() notification: CreateWeeklyNotification,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.notificationService.createWeeklyNotification(notification, user.userId);
  }

  @Put('daily-report')
  updateDailyNotification(
    @Body() notification: CreateDailyNotification,
    @AuthUser() user: AuthUserDto,
  ) {
    this.notificationService.deleteDailyNotification(user.userId);
    return this.notificationService.createDailyNotification(notification, user.userId);
  }

  @Put('weekly-report')
  updateWeeklyNotification(
    @Body() notification: CreateWeeklyNotification,
    @AuthUser() user: AuthUserDto,
  ) {
    this.notificationService.deleteWeeklyNotification(user.userId);
    return this.notificationService.createWeeklyNotification(notification, user.userId);
  }

  @Delete('daily-report')
  deleteDailyNotification(@AuthUser() user: AuthUserDto) {
    return this.notificationService.deleteDailyNotification(user.userId);
  }

  @Delete('weekly-report')
  deleteWeeklyNotification(@AuthUser() user: AuthUserDto) {
    return this.notificationService.deleteWeeklyNotification(user.userId);
  }
}
