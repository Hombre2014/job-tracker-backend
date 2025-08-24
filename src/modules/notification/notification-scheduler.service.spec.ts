import { NotificationSchedulerService } from './notification-scheduler.service';
import { ReportNotificationEnum } from './enums/report-notification.enum';
import { JobApplicationStatus } from '../job-applications/job-application-status.enum';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { BoardColumn } from '../board-columns/entities/board-column.entity';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { Company } from '../companies/entities/company.entity';
import { ConfigService } from '@nestjs/config';
import { EmailSenderService } from '../email-sender/email-sender.service';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('NotificationSchedulerService', () => {
  let service: NotificationSchedulerService;
  let repository: Repository<NotificationSchedule>;
  let emailSender: EmailSenderService;

  const validNotification = {
    id: '52d49f16-4981-4f43-ab4e-3281f732cdd6',
    user: {
      id: '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b',
      email: 'user@example.com',
      firstName: 'John',
      board: [
        {
          id: '9f62c332-6b21-495e-be44-ff5c8df0d5c1',
          isArchived: false,
          name: 'Test Board',
          columns: [
            {
              id: '39d7528f-ebaf-4bff-9586-5963740534d1',
              name: 'Applied',
              jobApplications: [
                {
                  id: '7728dbbc-cfa9-471a-a9f7-49acc5455510',
                  status: JobApplicationStatus.Deadline,
                  deadline: '2024-12-31T09:00:00Z', // a day before `validNotification.scheduledTime`
                  title: 'Test Job Title',
                  company: { name: 'Test Company Name' } as Company,
                  salary: '€1000',
                  column: { name: 'Applied' } as BoardColumn,
                } as JobApplication,
              ],
            } as BoardColumn,
          ],
        },
      ],
    },
    time: '09:00',
    type: ReportNotificationEnum.DAILY,
    timezoneOffset: 0,
    scheduledTime: new Date('2025-01-01T09:00:00Z'),
  } as NotificationSchedule;

  beforeEach(async () => {
    const repositoryMock = { find: jest.fn(), save: jest.fn(), findBy: jest.fn() };
    const emailSenderMock = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    const configServiceMock = { get: jest.fn().mockReturnValue('http://frontend/') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSchedulerService,
        { provide: getRepositoryToken(NotificationSchedule), useValue: repositoryMock },
        { provide: EmailSenderService, useValue: emailSenderMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();
    service = module.get<NotificationSchedulerService>(NotificationSchedulerService);
    repository = module.get<Repository<NotificationSchedule>>(
      getRepositoryToken(NotificationSchedule),
    );
    emailSender = module.get<EmailSenderService>(EmailSenderService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendScheduledNotification', () => {
    it('calls sendEmail with correct list of JobApplication and updates scheduledTime', async () => {
      // Arrange
      const next = new Date('2025-01-02T09:00:00Z');
      jest.spyOn(repository, 'find').mockResolvedValue([validNotification]);
      jest.spyOn(service, 'generateJobsHtmlPage').mockReturnValue('<html></html>');
      jest.spyOn(service, 'calculateNextNotificationTime').mockReturnValue(next);

      // Act
      await service.sendScheduledNotification();

      // Assert
      expect(emailSender.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailSender.sendEmail).toHaveBeenCalledWith(
        validNotification.user.email,
        `Your Job Tracker Daily Report for ${validNotification.user.board[0].name}`,
        expect.any(String),
      );
      expect((service as any).calculateNextNotificationTime).toHaveBeenCalledWith(
        validNotification,
      );
      expect((service as any).generateJobsHtmlPage).toHaveBeenCalledWith(
        {
          [JobApplicationStatus.JobCreated]: [],
          [JobApplicationStatus.Deadline]: [
            validNotification.user.board[0].columns[0].jobApplications[0],
          ],
          [JobApplicationStatus.Applied]: [],
          [JobApplicationStatus.Interview]: [],
          [JobApplicationStatus.OfferReceived]: [],
          [JobApplicationStatus.JobMoved]: [],
        } as Record<JobApplicationStatus, Array<JobApplication>>,
        validNotification.user.board[0].id,
        validNotification.user.firstName,
        9,
        validNotification.type,
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: validNotification.id,
          scheduledTime: next,
        }),
      );
    });

    it('skips archived boards and does not call sendEmail', async () => {
      // Arrange
      const notificationWithArchivedBoard = structuredClone(validNotification);
      notificationWithArchivedBoard.user.board[0].isArchived = true;

      const next = new Date('2025-01-02T09:00:00Z');
      jest.spyOn(repository, 'find').mockResolvedValue([notificationWithArchivedBoard]);
      jest.spyOn(service, 'generateJobsHtmlPage').mockReturnValue('<html></html>');
      jest.spyOn(service, 'calculateNextNotificationTime').mockReturnValue(next);

      // Act
      await service.sendScheduledNotification();

      // Assert
      expect(emailSender.sendEmail).not.toHaveBeenCalled();
      // Still should reschedule and save
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: notificationWithArchivedBoard.id,
          scheduledTime: next,
        }),
      );
    });
  });

  describe('rescheduleExpiredNotifications', () => {
    it('reschedules notifications with past scheduledTime', async () => {
      // Arrange
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const toBeRescheduled = structuredClone(validNotification);
      toBeRescheduled.scheduledTime = dayAgo;
      toBeRescheduled.time = '00:00';
      jest.spyOn(repository, 'findBy').mockResolvedValue([toBeRescheduled]);

      // Act
      await service.rescheduleExpiredNotifications();

      // Assert
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: toBeRescheduled.id,
          scheduledTime: tomorrow,
        }),
      );
    });
  });
});
