import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AssetEntryDto,
  DailyEntriesDto,
  NavSnapshotDto,
  SubmitEntriesDto,
  UpsertNavSnapshotDto,
} from '@nhabibap-myportfolio/shared-types';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { EntriesService } from './entries.service';

@ApiTags('entries')
@ApiBearerAuth()
@Controller('boards/:boardId')
@UseGuards(JwtAuthGuard)
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post('entries')
  @ApiOperation({ summary: 'Submit daily asset values' })
  @ApiResponse({ status: 201, type: DailyEntriesDto })
  submit(
    @Param('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitEntriesDto,
  ) {
    return this.entriesService.submitEntries(boardId, req.user.sub, dto);
  }

  @Get('entries/latest')
  @ApiOperation({ summary: 'Get latest entry per asset' })
  @ApiResponse({ status: 200, type: [AssetEntryDto] })
  latest(@Param('boardId') boardId: string, @Req() req: AuthenticatedRequest) {
    return this.entriesService.getLatestEntries(boardId, req.user.sub);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Get entries for a specific date' })
  @ApiResponse({ status: 200, type: DailyEntriesDto })
  forDate(
    @Param('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
    @Query('date') date: string,
  ) {
    return this.entriesService.getEntriesForDate(boardId, req.user.sub, date);
  }

  @Get('nav')
  @ApiOperation({ summary: 'Get NAV history' })
  @ApiResponse({ status: 200, type: [NavSnapshotDto] })
  nav(
    @Param('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: 'monthly' | 'quarterly' | 'yearly',
  ) {
    return this.entriesService.getNavHistory(
      boardId,
      req.user.sub,
      from,
      to,
      granularity,
    );
  }

  @Post('nav')
  @ApiOperation({ summary: 'Manually upsert a NAV snapshot (total value)' })
  @ApiResponse({ status: 201, type: NavSnapshotDto })
  upsertNav(
    @Param('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertNavSnapshotDto,
  ) {
    return this.entriesService.upsertManualNavSnapshot(
      boardId,
      req.user.sub,
      dto,
    );
  }

  @Delete('nav/:snapshotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a NAV snapshot' })
  @ApiResponse({ status: 204 })
  deleteNav(
    @Param('boardId') boardId: string,
    @Param('snapshotId') snapshotId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.entriesService.deleteNavSnapshot(
      boardId,
      req.user.sub,
      snapshotId,
    );
  }
}
