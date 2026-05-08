import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { BoardMember } from './board-member.entity';
import { AssetCategory } from '../../assets/entities/asset-category.entity';
import { NavSnapshot } from '../../entries/entities/nav-snapshot.entity';
import { CashFlowEntry } from '../../cash-flow/entities/cash-flow-entry.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => User, (user) => user.boards, { onDelete: 'CASCADE' })
  owner!: User;

  @Column()
  ownerId!: string;

  @Column({ type: 'bigint', default: 0 })
  bankBalance!: number;

  @Column({ type: 'bigint', default: 0 })
  cashBalance!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => BoardMember, (member) => member.board, { cascade: true })
  members!: BoardMember[];

  @OneToMany(() => AssetCategory, (cat) => cat.board, { cascade: true })
  categories!: AssetCategory[];

  @OneToMany(() => NavSnapshot, (snap) => snap.board, { cascade: true })
  navSnapshots!: NavSnapshot[];

  @OneToMany(() => CashFlowEntry, (entry) => entry.board, { cascade: true })
  cashFlowEntries!: CashFlowEntry[];
}
