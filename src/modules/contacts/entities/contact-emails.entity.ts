import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Contact } from './contact.entity';
import { ContactMethodType } from '../enums/contact-type.enum';
import { BaseEntity } from '../../../entities/base.entity';

@Entity('contact-emails')
export class ContactEmail extends BaseEntity {
  @Column()
  email: string;

  @ManyToOne(() => Contact, (contact) => contact.emails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({
    name: 'type',
    nullable: false,
  })
  type: ContactMethodType;
}
