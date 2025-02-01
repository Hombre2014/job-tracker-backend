import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { AuthUser } from '../auth/user.decorator';
import { ContactsService } from './contacts.service';
import { FindContactDto } from './dtos/find-contact.dto';
import { CreateContactDto } from './dtos/create-contact.dto';
import { AssignContactToJobApplication } from './dtos/assign-contact-to-job-application.dto';
import { UpdateContact } from './dtos/update-contact.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async getContacts(@AuthUser() user: AuthUserDto, @Query() params: FindContactDto) {
    return this.contactsService.find(user.userId, params);
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async createContact(
    @UploadedFile() photo: Express.Multer.File,
    @Body() body: CreateContactDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.contactsService.create(user.userId, body, photo);
  }

  @Put()
  @UseInterceptors(FileInterceptor('photo'))
  async updateContact(
    @UploadedFile() photo: Express.Multer.File,
    @Body() body: UpdateContact,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.contactsService.update(user.userId, body, photo);
  }

  @Post('/jobApplication/assign')
  async assignToJobApplication(
    @Body() body: AssignContactToJobApplication,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.contactsService.assignContactToJobApplication(
      body.contactId,
      body.jobApplicationId,
      user.userId,
    );
  }

  @Delete('/jobApplication/unassign')
  async unassignFromJobApplication(
    @Body() body: AssignContactToJobApplication,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.contactsService.unassignContactFromJobApplication(
      body.contactId,
      body.jobApplicationId,
      user.userId,
    );
  }

  @Delete('/:id')
  async deleteContact(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user: AuthUserDto) {
    return this.contactsService.delete(id, user.userId);
  }
}
