import { ApiProperty } from '@nestjs/swagger';

export class NewsItemDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ description: 'Human-readable source name, e.g. "CafeF"' })
  source!: string;

  @ApiProperty({
    nullable: true,
    description: 'ISO-8601 publish timestamp, or null when the feed omits it',
  })
  publishedAt!: string | null;
}
