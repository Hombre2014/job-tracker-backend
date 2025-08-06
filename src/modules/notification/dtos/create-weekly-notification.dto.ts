import { CreateDailyNotification } from './create-daily-notification.dto';
import { DayOfWeekEnum } from '../enums/day-of-week.enum';

export class CreateWeeklyNotification extends CreateDailyNotification {
  dayOfWeek: DayOfWeekEnum;
}
