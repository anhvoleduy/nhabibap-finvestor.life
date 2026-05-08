import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  capital!: number;

  @ApiPropertyOptional({ additionalProperties: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ minLength: 1 })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capital?: number;

  @ApiPropertyOptional({ additionalProperties: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AssetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  capital!: number;

  @ApiProperty({ additionalProperties: true, nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  currentValue!: number | null;

  @ApiProperty({ nullable: true })
  profit!: number | null;

  @ApiProperty({ nullable: true })
  profitPct!: number | null;

  @ApiProperty({ nullable: true })
  lastEntryDate!: string | null;

  @ApiProperty({ nullable: true })
  totalChi!: number | null;
}
