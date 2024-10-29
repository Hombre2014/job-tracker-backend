import { JobApplicationDto } from '../../job-applications/dtos/job-application.dto';
import { BaseDto } from '../../../dtos/base.dto';

export class BoardColumnDto extends BaseDto {
  name: string;

  order: number;

  boardId: string;

  jobApplications: JobApplicationDto[];
}
