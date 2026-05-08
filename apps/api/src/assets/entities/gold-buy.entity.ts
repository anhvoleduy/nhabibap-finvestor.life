import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Asset } from './asset.entity';

@Entity('gold_buys')
export class GoldBuy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  asset!: Asset;

  @Index()
  @Column()
  assetId!: string;

  @Column({ type: 'date' })
  buyDate!: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  chiAmount!: number;

  @Column({ type: 'bigint' })
  amountVnd!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
