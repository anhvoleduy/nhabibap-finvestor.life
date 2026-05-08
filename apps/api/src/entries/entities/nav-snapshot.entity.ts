import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';

@Entity('nav_snapshots')
@Unique(['boardId', 'snapshotDate'])
export class NavSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Board, (board) => board.navSnapshots, {
    onDelete: 'CASCADE',
  })
  board!: Board;

  @Index()
  @Column()
  boardId!: string;

  @Column({ type: 'date' })
  snapshotDate!: string;

  @Column({ type: 'bigint' })
  totalCapital!: number;

  @Column({ type: 'bigint' })
  totalValue!: number;
}
