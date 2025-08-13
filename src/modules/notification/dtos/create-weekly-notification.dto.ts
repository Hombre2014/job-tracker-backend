import { CreateDailyNotification } from './create-daily-notification.dto';
import { DayOfWeekEnum } from '../enums/day-of-week.enum';
import { IsEnum } from 'class-validator';

export class CreateWeeklyNotification extends CreateDailyNotification {
  @IsEnum(DayOfWeekEnum)
  dayOfWeek: DayOfWeekEnum;
}
