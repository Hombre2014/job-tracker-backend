import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { UsersModule } from './modules/users/users.module';
import { APP_PIPE } from '@nestjs/core';
import { getDataSourceOptions } from './database.config';
import { BoardsModule } from './modules/boards/boards.module';
import { BoardColumnsModule } from './modules/board-columns/board-columns.module';
import { JobApplicationsModule } from './modules/job-applications/job-applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailSenderModule } from './modules/email-sender/email-sender.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { JobApplicationNotesModule } from './modules/job-application-notes/job-application-notes.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AppwriteUploadsModule } from './modules/appwrite-uploads/appwrite-uploads.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AppController } from './app.controller';
import { CacheControlMiddleware } from './cache-control.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...getDataSourceOptions(),
    }),
    HealthCheckModule,
    UsersModule,
    BoardsModule,
    BoardColumnsModule,
    JobApplicationsModule,
    AuthModule,
    EmailSenderModule,
    ContactsModule,
    JobApplicationNotesModule,
    CompaniesModule,
    AppwriteUploadsModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CacheControlMiddleware).forRoutes('*');
  }
}
