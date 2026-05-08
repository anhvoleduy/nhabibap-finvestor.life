import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AssetEntryValueDto {
  @ApiProperty()
  @IsString()
  assetId!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  currentValue!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitEntriesDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty({ type: () => [AssetEntryValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetEntryValueDto)
  entries!: AssetEntryValueDto[];
}

export class AssetEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  assetName!: string;

  @ApiProperty()
  entryDate!: string;

  @ApiProperty()
  currentValue!: number;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdBy!: string;
}

export class DailyEntriesDto {
  @ApiProperty()
  date!: string;

  @ApiProperty({ type: () => [AssetEntryDto] })
  entries!: AssetEntryDto[];
}
