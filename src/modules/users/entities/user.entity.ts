import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { UserRole, UserRoleType } from '../enums/user-role.enum';
import { Board } from '../../boards/entities/board.entity';
import { BaseEntity } from '../../../entities/base.entity';
import { UserCodeVerification } from './user.code.verification.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRoleType;

  @Column({ name: 'profile_pic_url', nullable: true })
  profilePicUrl: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @OneToMany(() => Board, (board) => board.user)
  board: Board[];

  @OneToMany(() => UserCodeVerification, (userCode) => userCode.user)
  userCodeVerifications: UserCodeVerification[];

  @OneToMany(() => Document, (document) => document.user)
  documents: Document[];

  private currentPassword: string;

  @AfterLoad()
  loadCurrentPassword() {
    this.currentPassword = this.password;
  }

  @BeforeUpdate()
  async hashPasswordIfNeeded() {
    if (this.password !== this.currentPassword && !this.password.startsWith('$2b$10$')) {
      await this.hashPassword();
    }
  }

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
    this.currentPassword = this.password;
  }
}
