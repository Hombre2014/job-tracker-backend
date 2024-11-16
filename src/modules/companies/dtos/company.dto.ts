import { BaseDto } from '../../../dtos/base.dto';

export class CompanyDto extends BaseDto {
  name: string;

  description?: string;

  url?: string;

  industry?: string;

  jobApplicationId?: string;
}
