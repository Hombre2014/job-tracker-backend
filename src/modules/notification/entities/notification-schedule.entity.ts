import { BaseEntity } from '../../../entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { DayOfWeekEnum, DayOfWeekType } from '../enums/day-of-week.enum';
import { ReportNotificationEnum, ReportNotificationType } from '../enums/report-notification.enum';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity('notification_schedules')
@Check(`("type" != '${ReportNotificationEnum.WEEKLY}') OR ("day_of_week" IS NOT NULL)`)
@Check(`"time" ~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'`)
@Check('"timezone_offset" >= -840 AND "timezone_offset" <= 720')
@Unique('UN_NOTIFICATION_TYPE_PER_USER', ['user', 'type'])
export class NotificationSchedule extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notificationSchedules, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 5 }) // HH:mm format
  time: string;

  @Column({ name: 'timezone_offset', type: 'int' })
  timezoneOffset: number;

  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: DayOfWeekEnum,
    nullable: true,
  })
  dayOfWeek: DayOfWeekType;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ReportNotificationEnum,
    nullable: false,
  })
  type: ReportNotificationType;

  // Always store the scheduled time in UTC
  @Column({ name: 'scheduled_time', type: 'timestamptz' })
  @Index('IDX_NOTIFICATION_SCHEDULE_SCHEDULED_TIME')
  scheduledTime: Date;
}
