import { BaseDto } from '../../../dtos/base.dto';
import { JobApplication } from '../../job-applications/entities/job-application.entity';

export class CompanyDto extends BaseDto {
  name: string;

  description?: string;

  url?: string;

  logo?: string;

  industry?: string;

  jobApplications?: JobApplication[];
}
