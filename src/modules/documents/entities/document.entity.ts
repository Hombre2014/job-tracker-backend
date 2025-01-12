import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentCategory } from '../document-category.enum';
import { Board } from '../../boards/entities/board.entity';

@Entity('documents')
export class Document extends BaseEntity {
  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.Other,
  })
  category: DocumentCategory;

  @Column({ nullable: true })
  description?: string;

  @Column()
  url: string;

  @ManyToOne(() => Board, (board) => board.documents, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'board_id' })
  board?: Board;
}
