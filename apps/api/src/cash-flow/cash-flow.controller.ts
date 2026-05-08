import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
  CashFlowEntryDto,
  CreateCashFlowDto,
  UpdateCashFlowDto,
} from '@nhabibap-myportfolio/shared-types';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CashFlowService } from './cash-flow.service';

@ApiTags('cash-flow')
@ApiBearerAuth()
@Controller('boards/:boardId/cash-flow')
@UseGuards(JwtAuthGuard)
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Get()
  @ApiOperation({ summary: 'List cash flow entries' })
  @ApiResponse({ status: 200, type: [CashFlowEntryDto] })
  list(@Param('boardId') boardId: string, @Req() req: AuthenticatedRequest) {
    return this.cashFlowService.list(boardId, req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create cash flow entry' })
  @ApiResponse({ status: 201, type: CashFlowEntryDto })
  create(
    @Param('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCashFlowDto,
  ) {
    return this.cashFlowService.create(boardId, req.user.sub, dto);
  }

  @Patch(':entryId')
  @ApiOperation({ summary: 'Update cash flow entry' })
  @ApiResponse({ status: 200, type: CashFlowEntryDto })
  update(
    @Param('boardId') boardId: string,
    @Param('entryId') entryId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCashFlowDto,
  ) {
    return this.cashFlowService.update(boardId, entryId, req.user.sub, dto);
  }

  @Delete(':entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete cash flow entry' })
  @ApiResponse({ status: 204 })
  remove(
    @Param('boardId') boardId: string,
    @Param('entryId') entryId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cashFlowService.remove(boardId, entryId, req.user.sub);
  }
}
