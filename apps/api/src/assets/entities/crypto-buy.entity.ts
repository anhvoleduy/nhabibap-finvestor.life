import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Asset } from './asset.entity';

@Entity('crypto_buys')
export class CryptoBuy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  asset!: Asset;

  @Index()
  @Column()
  assetId!: string;

  @Column({ type: 'date' })
  buyDate!: string;

  @Column({ type: 'bigint' })
  amountVnd!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
