import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssetCategory } from './asset-category.entity';
import { AssetEntry } from '../../entries/entities/asset-entry.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AssetCategory, (cat) => cat.assets, { onDelete: 'CASCADE' })
  category!: AssetCategory;

  @Index()
  @Column()
  categoryId!: string;

  @Column()
  name!: string;

  @Column({ type: 'bigint', default: 0, nullable: true })
  capital!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => AssetEntry, (entry) => entry.asset, { cascade: true })
  entries!: AssetEntry[];
}
