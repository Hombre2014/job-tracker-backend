import { BaseEntity } from '../../../entities/base.entity';
import { Column, Entity, ManyToMany, OneToMany, Index } from 'typeorm';
import { JobApplication } from '../../job-applications/entities/job-application.entity';
import { Contact } from '../../contacts/entities/contact.entity';

@Entity('companies')
@Index('idx_company_url', ['url'])
export class Company extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string | null;

  @Column({ nullable: true, unique: true })
  url: string | null;

  @Column({ nullable: true })
  logo: string | null;

  @Column({ nullable: true })
  industry: string | null;

  @OneToMany(() => JobApplication, (jobApplication) => jobApplication.company)
  jobApplications: JobApplication[];

  @ManyToMany(() => Contact, (contact) => contact.companies)
  contacts: Contact[];
}
