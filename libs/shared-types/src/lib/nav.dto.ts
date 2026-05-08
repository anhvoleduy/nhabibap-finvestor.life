import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class NavSnapshotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  boardId!: string;

  @ApiProperty()
  snapshotDate!: string;

  @ApiProperty()
  totalCapital!: number;

  @ApiProperty()
  totalValue!: number;

  @ApiProperty()
  profit!: number;

  @ApiProperty()
  profitPct!: number;

  @ApiProperty({ nullable: true })
  periodGrowth!: number | null;
}

export class UpsertNavSnapshotDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalValue!: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalCapital?: number;
}
