import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryType, NewsItemDto } from '@nhabibap-myportfolio/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NewsService } from './news.service';

@ApiTags('news')
@ApiBearerAuth()
@Controller('news')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List news headlines for an asset category' })
  @ApiQuery({ name: 'type', enum: CategoryType })
  @ApiResponse({ status: 200, type: [NewsItemDto] })
  list(@Query('type') type: string): Promise<NewsItemDto[]> {
    if (!Object.values(CategoryType).includes(type as CategoryType)) {
      throw new BadRequestException(`Unknown category type: ${type}`);
    }
    return this.newsService.getNews(type as CategoryType);
  }
}
