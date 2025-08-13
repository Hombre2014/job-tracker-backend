import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Board } from './modules/boards/entities/board.entity';
import { Contact } from './modules/contacts/entities/contact.entity';
import { Company } from './modules/companies/entities/company.entity';
import { Document } from './modules/documents/entities/document.entity';
import { ContactEmail } from './modules/contacts/entities/contact-emails.entity';
import { ContactPhone } from './modules/contacts/entities/contact-phones.entity';
import { BoardColumn } from './modules/board-columns/entities/board-column.entity';
import { JobApplication } from './modules/job-applications/entities/job-application.entity';
import { UserCodeVerification } from './modules/users/entities/user.code.verification.entity';
import { JobApplicationNote } from './modules/job-application-notes/entities/job-application-note.entity';
import { NotificationSchedule } from './modules/notification/entities/notification-schedule.entity';

if (process.env.NODE_ENV !== 'test') {
  config();
} else {
  config({ path: '.env.test' });
}

export const getDataSourceOptions = (): DataSourceOptions => {
  // Use individual parameters for local development (when DB_HOST is set)
  if (process.env.DB_HOST) {
    return {
      ssl: false, // Local database doesn't use SSL
      type: 'postgres',
      synchronize: false,
      migrationsRun: false,
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      logging: ['query', 'warn', 'error'],
      migrations: ['dist/src/migrations/**/*.js'],
      entities: [
        User,
        Board,
        Contact,
        Company,
        Document,
        BoardColumn,
        ContactEmail,
        ContactPhone,
        JobApplication,
        JobApplicationNote,
        UserCodeVerification,
        NotificationSchedule,
      ],
    };
  }

  // Use DATABASE_URL for production (when DB_HOST is not set)
  return {
    type: 'postgres',
    synchronize: false,
    migrationsRun: false,
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    logging: ['query', 'warn', 'error'],
    migrations: ['dist/src/migrations/**/*.js'],
    entities: [
      User,
      Board,
      Contact,
      Company,
      Document,
      BoardColumn,
      ContactEmail,
      ContactPhone,
      JobApplication,
      JobApplicationNote,
      UserCodeVerification,
      NotificationSchedule,
    ],
  };
};

export default getDataSourceOptions;
