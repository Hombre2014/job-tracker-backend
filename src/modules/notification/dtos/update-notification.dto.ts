import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { CreateDailyNotification } from './create-daily-notification.dto';
import { CreateWeeklyNotification } from './create-weekly-notification.dto';
import { Type } from 'class-transformer';

export class UpdateNotification {
  @IsObject()
  @Type(() => CreateDailyNotification)
  @ValidateNested({ each: true })
  @IsOptional()
  daily: CreateDailyNotification;
  @IsObject()
  @Type(() => CreateWeeklyNotification)
  @ValidateNested({ each: true })
  @IsOptional()
  weekly: CreateWeeklyNotification;
}
