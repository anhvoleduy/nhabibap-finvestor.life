import { ApiProperty } from '@nestjs/swagger';

export class PriceQuoteDto {
  @ApiProperty({
    description: 'Stable identifier, e.g. "BTC", "GOLD-SJC", "USD/VND"',
  })
  symbol!: string;

  @ApiProperty({
    description: 'Human-readable label, e.g. "Bitcoin", "Vàng SJC"',
  })
  label!: string;

  @ApiProperty({ description: 'Latest price value' })
  price!: number;

  @ApiProperty({ description: 'Price unit, e.g. "USD", "VND", "VND/chỉ"' })
  unit!: string;

  @ApiProperty({
    nullable: true,
    description: '24h change percent, or null when the source omits it',
  })
  changePct!: number | null;

  @ApiProperty({ description: 'Human-readable source name, e.g. "CoinGecko"' })
  source!: string;

  @ApiProperty({
    description: 'ISO-8601 timestamp of when this quote was fetched',
  })
  updatedAt!: string;
}
