import { BadRequestException as ConflictException } from '@nestjs/common';

export class NotificationAlreadyExistsException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}
