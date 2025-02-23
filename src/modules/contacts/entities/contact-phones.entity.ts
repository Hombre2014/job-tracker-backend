import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Contact } from './contact.entity';
import { ContactMethodType } from '../enums/contact-type.enum';
import { BaseEntity } from '../../../entities/base.entity';

@Entity('contact-phones')
export class ContactPhone extends BaseEntity {
  @Column({ length: 16 })
  phone: string;

  @ManyToOne(() => Contact, (contact) => contact.phones, {
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
