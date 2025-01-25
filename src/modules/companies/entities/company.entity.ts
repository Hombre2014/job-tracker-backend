import { BaseEntity } from '../../../entities/base.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { JobApplication } from '../../job-applications/entities/job-application.entity';
import { Contact } from '../../contacts/entities/contact.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string | null;

  @Column({ nullable: true })
  url: string | null;

  @Column({ nullable: true })
  industry: string | null;

  @OneToMany(() => JobApplication, (jobApplication) => jobApplication.company)
  jobApplications: JobApplication[];

  @ManyToMany(() => Contact, (contact) => contact.companies)
  contacts: Contact[];
}
