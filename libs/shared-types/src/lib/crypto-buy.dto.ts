import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCryptoBuyDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  buyDate?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amountVnd?: number;
}

export class CreateCryptoBuyDto {
  @ApiProperty()
  @IsDateString()
  buyDate!: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amountVnd!: number;
}

export class CryptoBuyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  buyDate!: string;

  @ApiProperty()
  amountVnd!: number;

  @ApiProperty()
  createdAt!: string;
}
