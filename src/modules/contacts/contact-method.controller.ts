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
import { ContactMethodsService } from './contact-methods.service';
import { ContactEmailMapper } from './mappers/contact-email.mapper';
import { CreateContactPhoneDto } from './dtos/contact-method/create-contact-phone.dto';
import { ContactPhoneMapper } from './mappers/contact-phone.mapper';
import { ContactEmailDto } from './dtos/contact-method/contact-email.dto';
import { ContactPhoneDto } from './dtos/contact-method/contact-phone.dto';
import { CreateContactEmailDto } from './dtos/contact-method/create-contact-email.dto';

@Controller('contacts')
export class ContactMethodsController {
  constructor(
    private readonly contactMethodService: ContactMethodsService,
    private readonly contactEmailMapper: ContactEmailMapper,
    private readonly contactPhoneMapper: ContactPhoneMapper,
  ) {}

  @Get('/contact-method/email')
  async getContactMethodEmail(
    @Query('contactId', ParseUUIDPipe) contactId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    const entities = await this.contactMethodService.getContactMethodEmails(contactId, user.userId);
    return entities.map(this.contactEmailMapper.toDto);
  }

  @Get('/contact-method/phone')
  async getContactMethodPhone(
    @Query('contactId', ParseUUIDPipe) contactId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    const entities = await this.contactMethodService.getContactMethodPhones(contactId, user.userId);
    return entities.map(this.contactPhoneMapper.toDto);
  }

  @Post('/contact-method/email')
  async createContactMethodEmail(
    @Body() contactEmailDto: CreateContactEmailDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.contactMethodService.createContactMethodEmail(
      contactEmailDto,
      user.userId,
    );
    return this.contactEmailMapper.toDto(entity);
  }

  @Post('/contact-method/phone')
  async createContactMethodPhone(
    @Body() contactPhoneDto: CreateContactPhoneDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.contactMethodService.createContactMethodPhone(
      contactPhoneDto,
      user.userId,
    );
    return this.contactPhoneMapper.toDto(entity);
  }

  @Put('/contact-method/email')
  async updateContactMethodEmail(
    @Body() contactEmailDto: ContactEmailDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.contactMethodService.updateContactMethodEmail(
      contactEmailDto,
      user.userId,
    );
    return this.contactEmailMapper.toDto(entity);
  }

  @Put('/contact-method/phone')
  async updateContactMethodPhone(
    @Body() contactPhoneDto: ContactPhoneDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.contactMethodService.updateContactMethodPhone(
      contactPhoneDto,
      user.userId,
    );
    return this.contactPhoneMapper.toDto(entity);
  }

  @Delete('/contact-method/email/:id')
  async deleteContactMethodEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: AuthUserDto,
  ) {
    await this.contactMethodService.deleteContactMethodEmail(id, user.userId);
  }

  @Delete('/contact-method/phone/:id')
  async deleteContactMethodPhone(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: AuthUserDto,
  ) {
    await this.contactMethodService.deleteContactMethodPhone(id, user.userId);
  }
}
