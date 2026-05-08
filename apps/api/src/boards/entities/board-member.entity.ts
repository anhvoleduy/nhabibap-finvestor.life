import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Board } from './board.entity';
import { User } from '../../auth/entities/user.entity';

export type MemberRole = 'EDITOR' | 'VIEWER';

@Entity('board_members')
@Unique(['boardId', 'userId'])
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: 'CASCADE' })
  board!: Board;

  @Index()
  @Column()
  boardId!: string;

  @ManyToOne(() => User, (user) => user.boardMemberships, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Index()
  @Column()
  userId!: string;

  @Column({ type: 'varchar' })
  role!: MemberRole;
}
