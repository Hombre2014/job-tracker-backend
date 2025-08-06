import { BaseEntity } from '../../../entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { DayOfWeekEnum, DayOfWeekType } from '../enums/day-of-week.enum';
import { ReportNotificationEnum, ReportNotificationType } from '../enums/report-notification.enum';
import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity('notification_settings')
@Check(`("type" != '${ReportNotificationEnum.WEEKLY}') OR ("day_of_week" IS NOT NULL)`)
@Unique('UN_NOTIFICATION_TYPE_PER_USER', ['user', 'type'])
@Check(`"time" ~ '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$'`)
export class NotificationSetting extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notificationSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 5 }) // HH:mm format
  time: string;

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
}
