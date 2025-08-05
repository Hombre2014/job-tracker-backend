import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  createDailyNotification(notification: any, userId: any) {
    console.log('Creating daily notification for user:', userId);
    console.log('Notification details:', notification);
    throw new Error('Method not implemented.');
  }
  createWeeklyNotification(notification: any, userId: string) {
    console.log('Creating weekly notification for user:', userId);
    console.log('Notification details:', notification);
    throw new Error('Method not implemented.');
  }
  deleteDailyNotification(userId: string) {
    console.log('Deleting daily notification for user:', userId);
    throw new Error('Method not implemented.');
  }
  deleteWeeklyNotification(userId: string) {
    console.log('Deleting weekly notification for user:', userId);
    throw new Error('Method not implemented.');
  }
}
