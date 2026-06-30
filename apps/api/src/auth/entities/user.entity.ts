import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { BoardMember } from '../../boards/entities/board-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  name!: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationTokenExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Board, (board) => board.owner)
  boards!: Board[];

  @OneToMany(() => BoardMember, (member) => member.user)
  boardMemberships!: BoardMember[];
}
