import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { AssetDto } from './asset.dto';

export enum CategoryType {
  GOLD = 'GOLD',
  OPEN_FUND = 'OPEN_FUND',
  ETF = 'ETF',
  CRYPTO = 'CRYPTO',
  SAVINGS = 'SAVINGS',
  CASH = 'CASH',
}

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  [CategoryType.GOLD]: 'Vàng',
  [CategoryType.OPEN_FUND]: 'Quỹ Mở',
  [CategoryType.ETF]: 'Quỹ ETF',
  [CategoryType.CRYPTO]: 'Tiền Điện Tử',
  [CategoryType.SAVINGS]: 'Số Tiết Kiệm',
  [CategoryType.CASH]: 'Tiền Mặt',
};

export class CreateCategoryDto {
  @ApiProperty({ enum: CategoryType })
  @IsIn(Object.values(CategoryType))
  type!: CategoryType;
}

export class AssetCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  boardId!: string;

  @ApiProperty({ enum: CategoryType })
  type!: CategoryType;

  @ApiProperty()
  label!: string;

  @ApiProperty({ type: () => [AssetDto] })
  assets!: AssetDto[];

  @ApiProperty({ nullable: true })
  totalCapital!: number | null;

  @ApiProperty()
  totalValue!: number;

  @ApiProperty({ nullable: true })
  profitPct!: number | null;
}
