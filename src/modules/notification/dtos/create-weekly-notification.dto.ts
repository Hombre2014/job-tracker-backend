import { CreateDailyNotification } from './create-daily-notification.dto';
import { DayOfWeek } from './day-of-week.enum';

export class CreateWeeklyNotification extends CreateDailyNotification {
  dayOfWeek: DayOfWeek;
}
