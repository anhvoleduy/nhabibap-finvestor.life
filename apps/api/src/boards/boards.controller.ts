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
  AddMemberDto,
  BoardDto,
  BoardMemberDto,
  BoardSummaryDto,
  CreateBoardDto,
  UpdateBoardDto,
} from '@nhabibap-myportfolio/shared-types';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { BoardsService } from './boards.service';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'List boards for current user' })
  @ApiResponse({ status: 200, type: [BoardSummaryDto] })
  list(@Req() req: AuthenticatedRequest) {
    return this.boardsService.getUserBoards(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create board' })
  @ApiResponse({ status: 201, type: BoardDto })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBoardDto) {
    return this.boardsService.createBoard(req.user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board detail' })
  @ApiResponse({ status: 200, type: BoardDto })
  get(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.boardsService.getBoardById(id, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update board name' })
  @ApiResponse({ status: 200, type: BoardDto })
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.updateBoard(id, req.user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete board (owner only)' })
  @ApiResponse({ status: 204 })
  delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.boardsService.deleteBoard(id, req.user.sub);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Share board with user' })
  @ApiResponse({ status: 201, type: BoardMemberDto })
  addMember(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddMemberDto,
  ) {
    return this.boardsService.addMember(id, req.user.sub, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove board member' })
  @ApiResponse({ status: 204 })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.boardsService.removeMember(id, req.user.sub, userId);
  }
}
