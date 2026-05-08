import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
// Keep in sync with FlowType enum in shared-types
export type FlowType = 'INCOME' | 'EXPENSE';

@Entity('cash_flow_entries')
export class CashFlowEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Board, (board) => board.cashFlowEntries, {
    onDelete: 'CASCADE',
  })
  board!: Board;

  @Index()
  @Column()
  boardId!: string;

  @Column({ type: 'date' })
  entryDate!: string;

  @Column()
  label!: string;

  @Column({ type: 'bigint' })
  amount!: number;

  @Column({ type: 'varchar' })
  flowType!: FlowType;

  @CreateDateColumn()
  createdAt!: Date;
}
