import { Body, Controller, Delete, Get, HttpCode, Post, Put } from '@nestjs/common';
import { AuthUser } from '../auth/user.decorator';
import { NotificationService } from './notification.service';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { CreateDailyNotification } from './dtos/create-daily-notification.dto';
import { CreateWeeklyNotification } from './dtos/create-weekly-notification.dto';
import { UpdateNotification } from './dtos/update-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('report')
  getBothNotifications(@AuthUser() user: AuthUserDto) {
    return this.notificationService.getBothNotifications(user.userId);
  }

  /**
   * Creates/Updates/Deletes both notification.
   * If daily\week field is null - removes notification.
   * @param user - user info from JWT
   * @returns current users notification settings
   */
  @Post('report')
  updateBothNotifications(@Body() notification: UpdateNotification, @AuthUser() user: AuthUserDto) {
    return this.notificationService.updateBothNotifications(notification, user.userId);
  }

  @Get('daily-report')
  getDailyNotification(@AuthUser() user: AuthUserDto) {
    return this.notificationService.getDailyNotification(user.userId);
  }

  @Get('weekly-report')
  getWeeklyNotification(@AuthUser() user: AuthUserDto) {
    return this.notificationService.getWeeklyNotification(user.userId);
  }

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
    return this.notificationService.updateDailyNotification(notification, user.userId);
  }

  @Put('weekly-report')
  updateWeeklyNotification(
    @Body() notification: CreateWeeklyNotification,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.notificationService.updateWeeklyNotification(notification, user.userId);
  }

  @Delete('daily-report')
  @HttpCode(204)
  async deleteDailyNotification(@AuthUser() user: AuthUserDto) {
    await this.notificationService.deleteDailyNotification(user.userId);
  }

  @Delete('weekly-report')
  @HttpCode(204)
  async deleteWeeklyNotification(@AuthUser() user: AuthUserDto) {
    await this.notificationService.deleteWeeklyNotification(user.userId);
  }
}
