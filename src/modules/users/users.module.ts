import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserMapper } from './users.mapper';
import { EmailSenderModule } from '../email-sender/email-sender.module';
import { UserCodeVerificationService } from './user-code-verification.service';
import { UserCodeVerification } from './entities/user.code.verification.entity';
import { BoardsModule } from '../boards/boards.module';
import { AppwriteUploadsModule } from '../appwrite-uploads/appwrite-uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserCodeVerification]),
    EmailSenderModule,
    BoardsModule,
    AppwriteUploadsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserMapper, UserCodeVerificationService],
  exports: [UsersService, UserCodeVerificationService],
})
export class UsersModule {}
