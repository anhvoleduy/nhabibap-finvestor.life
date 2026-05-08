import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { Asset } from './asset.entity';
// Keep in sync with CategoryType enum in shared-types
export type CategoryType =
  | 'GOLD'
  | 'OPEN_FUND'
  | 'ETF'
  | 'CRYPTO'
  | 'SAVINGS'
  | 'CASH';

@Entity('asset_categories')
@Unique(['boardId', 'type'])
export class AssetCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Board, (board) => board.categories, { onDelete: 'CASCADE' })
  board!: Board;

  @Index()
  @Column()
  boardId!: string;

  @Column({ type: 'varchar' })
  type!: CategoryType;

  @OneToMany(() => Asset, (asset) => asset.category, { cascade: true })
  assets!: Asset[];
}
