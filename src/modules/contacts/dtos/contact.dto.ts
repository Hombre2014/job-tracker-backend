import { BoardDto } from '../../boards/dtos/board.dto';
import { JobApplicationDto } from '../../job-applications/dtos/job-application.dto';
import { ContactEmailDto } from './contact-method/contact-email.dto';
import { ContactPhoneDto } from './contact-method/contact-phone.dto';
import { BaseDto } from '../../../dtos/base.dto';
import { Company } from '../../companies/entities/company.entity';

export class ContactDto extends BaseDto {
  firstName: string;

  lastName: string;

  jobTitle: string;

  board: BoardDto;

  jobApplications: JobApplicationDto[];

  emails: ContactEmailDto[];

  phones: ContactPhoneDto[];

  companies: Company[];

  twitterUrl: string;

  facebookUrl: string;

  linkedinUrl: string;

  githubUrl: string;

  comment: string;

  photoUrl: string;

  location: string;
}
