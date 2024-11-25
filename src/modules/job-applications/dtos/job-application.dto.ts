import { BaseDto } from '../../../dtos/base.dto';
import { JobApplicationNoteDto } from 'src/modules/job-application-notes/dtos/job-application-note.dto';
import { BoardColumnDto } from '../../board-columns/dtos/board-column.dto';
import { ContactDto } from '../../contacts/dtos/contact.dto';
import { CompanyDto } from '../../companies/dtos/company.dto';
import { JobApplicationStatus } from '../job-application-status.enum';

export class JobApplicationDto extends BaseDto {
  title: string;

  description: string | null;

  columnId: string;

  postUrl: string;

  salary: string;

  location: string;

  color: string;

  deadline: string;

  notes: JobApplicationNoteDto[] | null;

  column: BoardColumnDto;

  contacts: ContactDto[] | null;

  company: CompanyDto | null;

  statusChangedAt: string;

  status: JobApplicationStatus;
}
