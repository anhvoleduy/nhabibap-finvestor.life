import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateGoldBuyDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  buyDate?: string;

  @ApiPropertyOptional({ minimum: 0.0001 })
  @IsNumber()
  @Min(0.0001)
  @IsOptional()
  chiAmount?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amountVnd?: number;
}

export class CreateGoldBuyDto {
  @ApiProperty()
  @IsDateString()
  buyDate!: string;

  @ApiProperty({ minimum: 0.0001 })
  @IsNumber()
  @Min(0.0001)
  chiAmount!: number;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amountVnd!: number;
}

export class GoldBuyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  buyDate!: string;

  @ApiProperty()
  chiAmount!: number;

  @ApiProperty()
  amountVnd!: number;

  @ApiProperty()
  createdAt!: string;
}
