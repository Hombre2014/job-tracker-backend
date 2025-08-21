import { NotificationSchedulerService } from './notification-scheduler.service';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { JobApplicationStatus } from '../job-applications/job-application-status.enum';

describe('NotificationSchedulerService', () => {
  let service: NotificationSchedulerService;
  let repo: any;
  let emailSender: any;
  let configService: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      save: jest.fn(),
      findBy: jest.fn(),
    };
    emailSender = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    configService = { get: jest.fn().mockReturnValue('http://frontend/') };

    service = new NotificationSchedulerService(
      configService as any,
      emailSender as any,
      repo as any,
    );
  });

  it('calls sendEmail with correct subject and updates scheduledTime', async () => {
    const notification = {
      id: 'n1',
      user: {
        id: 'u1',
        email: 'user@example.com',
        firstName: 'John',
        board: [
          {
            id: 'b1',
            isArchived: false,
          },
        ],
      },
      time: '09:00',
      type: ReportNotificationEnum.DAILY,
      timezoneOffset: 0,
      scheduledTime: new Date('2025-01-01T09:00:00Z'),
    } as any;

    repo.find.mockResolvedValue([notification]);

    // Make prepareDataForReport truthy so email is sent
    jest.spyOn(service as any, 'prepareDataForReport').mockReturnValue({
      [JobApplicationStatus.JobCreated]: [],
    });
    jest.spyOn(service as any, 'generateJobsHtmlPage').mockReturnValue('<html></html>');
    const next = new Date('2025-01-02T09:00:00Z');
    jest.spyOn(service as any, 'calculateNextNotificationTime').mockReturnValue(next);

    await service.sendScheduledNotification();

    expect(emailSender.sendEmail).toHaveBeenCalledTimes(1);
    // Do not validate email parameter or the html content
    expect(emailSender.sendEmail).toHaveBeenCalledWith(
      expect.anything(),
      'Your Job Tracker Daily Report',
      expect.any(String),
    );

    expect((service as any).calculateNextNotificationTime).toHaveBeenCalledWith(notification);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'n1',
        scheduledTime: next,
      }),
    );
  });

  it('skips archived boards and does not call sendEmail', async () => {
    const notification = {
      id: 'n2',
      user: {
        id: 'u2',
        email: 'arch@example.com',
        firstName: 'Jane',
        board: [
          {
            id: 'b2',
            isArchived: true,
          },
        ],
      },
      time: '09:00',
      type: ReportNotificationEnum.DAILY,
      timezoneOffset: 0,
      scheduledTime: new Date('2025-01-01T09:00:00Z'),
    } as any;

    repo.find.mockResolvedValue([notification]);
    jest.spyOn(service as any, 'prepareDataForReport').mockReturnValue({});
    jest.spyOn(service as any, 'generateJobsHtmlPage').mockReturnValue('<html></html>');
    jest.spyOn(service as any, 'calculateNextNotificationTime').mockReturnValue(new Date());

    await service.sendScheduledNotification();

    expect(emailSender.sendEmail).not.toHaveBeenCalled();
    // Still should reschedule and save
    expect(repo.save).toHaveBeenCalled();
  });
});
