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
} from '@nestjs/common';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { AuthUser } from '../auth/user.decorator';
import { ContactsService } from './contacts.service';
import { FindContactDto } from './dtos/find-contact.dto';
import { CreateContactDto } from './dtos/create-contact.dto';
import { AssignContactToJobApplication } from './dtos/assign-contact-to-job-application.dto';
import { UpdateContact } from './dtos/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async getContacts(@AuthUser() user: AuthUserDto, @Query() params: FindContactDto) {
    return await this.contactsService.find(user.userId, params);
  }

  @Post()
  async createContact(@Body() body: CreateContactDto, @AuthUser() user: AuthUserDto) {
    await this.contactsService.create(user.userId, body);
  }

  @Put()
  async updateContact(@Body() body: UpdateContact, @AuthUser() user: AuthUserDto) {
    await this.contactsService.update(user.userId, body);
  }

  @Post('/jobApplication/assign')
  async assignToJobApplication(
    @Body() body: AssignContactToJobApplication,
    @AuthUser() user: AuthUserDto,
  ) {
    await this.contactsService.assignContactToJobApplication(
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
    await this.contactsService.unassignContactFromJobApplication(
      body.contactId,
      body.jobApplicationId,
      user.userId,
    );
  }

  @Delete('/:id')
  async deleteContact(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user: AuthUserDto) {
    await this.contactsService.delete(id, user.userId);
  }
}
