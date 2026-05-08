import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('asset_entries')
@Unique(['assetId', 'entryDate'])
export class AssetEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Asset, (asset) => asset.entries, { onDelete: 'CASCADE' })
  asset!: Asset;

  @Index()
  @Column()
  assetId!: string;

  @Column({ type: 'date' })
  entryDate!: string;

  @Column({ type: 'bigint' })
  currentValue!: number;

  @Column({ nullable: true, type: 'varchar' })
  notes!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  createdBy!: User | null;

  @Index()
  @Column({ nullable: true })
  createdById!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
