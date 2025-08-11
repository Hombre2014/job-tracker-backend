export enum ReportNotificationEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export type ReportNotificationType = keyof typeof ReportNotificationEnum;
