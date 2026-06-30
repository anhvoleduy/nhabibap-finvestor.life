import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PriceQuoteDto } from '@nhabibap-myportfolio/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PricesService } from './prices.service';

@ApiTags('prices')
@ApiBearerAuth()
@Controller('prices')
@UseGuards(JwtAuthGuard)
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  @ApiOperation({ summary: 'Realtime price quotes for the ticker' })
  @ApiResponse({ status: 200, type: [PriceQuoteDto] })
  list(): Promise<PriceQuoteDto[]> {
    return this.pricesService.getQuotes();
  }
}
