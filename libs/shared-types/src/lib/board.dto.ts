import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BoardMemberDto } from './member.dto';

export class CreateBoardDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpdateBoardDto {
  @ApiPropertyOptional({ minLength: 1 })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bankBalance?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cashBalance?: number;
}

export class BoardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  ownerName!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: () => [BoardMemberDto] })
  members!: BoardMemberDto[];

  @ApiProperty({ enum: ['OWNER', 'EDITOR', 'VIEWER'] })
  role!: 'OWNER' | 'EDITOR' | 'VIEWER';

  @ApiProperty()
  bankBalance!: number;

  @ApiProperty()
  cashBalance!: number;
}

export class BoardSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  ownerName!: string;

  @ApiProperty({ enum: ['OWNER', 'EDITOR', 'VIEWER'] })
  role!: 'OWNER' | 'EDITOR' | 'VIEWER';

  @ApiProperty()
  totalCapital!: number;

  @ApiProperty()
  totalValue!: number;

  @ApiProperty()
  profitPct!: number;

  @ApiProperty()
  createdAt!: string;
}
