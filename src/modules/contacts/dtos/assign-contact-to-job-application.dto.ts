import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignContactToJobApplication {
  @IsUUID()
  @IsNotEmpty()
  contactId: string;

  @IsUUID()
  @IsNotEmpty()
  jobApplicationId: string;
}
