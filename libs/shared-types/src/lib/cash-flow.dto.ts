import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum FlowType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateCashFlowDto {
  @ApiProperty()
  @IsDateString()
  entryDate!: string;

  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: FlowType })
  @IsIn(Object.values(FlowType))
  flowType!: FlowType;
}

export class UpdateCashFlowDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  entryDate?: string;

  @ApiPropertyOptional({ minLength: 1 })
  @IsString()
  @MinLength(1)
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: FlowType })
  @IsOptional()
  @IsIn(Object.values(FlowType))
  flowType?: FlowType;
}

export class CashFlowEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  boardId!: string;

  @ApiProperty()
  entryDate!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty({ enum: FlowType })
  flowType!: FlowType;
}
