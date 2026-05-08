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
  AssetCategoryDto,
  AssetDto,
  CreateAssetDto,
  CreateCategoryDto,
  CreateCryptoBuyDto,
  CreateGoldBuyDto,
  CryptoBuyDto,
  GoldBuyDto,
  UpdateAssetDto,
  UpdateCryptoBuyDto,
  UpdateGoldBuyDto,
} from '@nhabibap-myportfolio/shared-types';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { AssetsService } from './assets.service';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('boards/:boardId/categories')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List categories with assets' })
  @ApiResponse({ status: 200, type: [AssetCategoryDto] })
  list(@Param('boardId') boardId: string, @Req() req: AuthenticatedRequest) {
    return this.assetsService.getCategories(boardId, req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, type: AssetCategoryDto })
  createCategory(
    @Param('boardId') boardId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.assetsService.createCategory(boardId, req.user.sub, dto);
  }

  @Post(':catId/assets')
  @ApiOperation({ summary: 'Create asset in category' })
  @ApiResponse({ status: 201, type: AssetDto })
  createAsset(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAssetDto,
  ) {
    return this.assetsService.createAsset(boardId, catId, req.user.sub, dto);
  }

  @Patch(':catId/assets/:assetId')
  @ApiOperation({ summary: 'Update asset' })
  @ApiResponse({ status: 200, type: AssetDto })
  updateAsset(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.updateAsset(
      boardId,
      catId,
      assetId,
      req.user.sub,
      dto,
    );
  }

  @Delete(':catId/assets/:assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete asset' })
  @ApiResponse({ status: 204 })
  deleteAsset(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assetsService.deleteAsset(
      boardId,
      catId,
      assetId,
      req.user.sub,
    );
  }

  @Get(':catId/assets/:assetId/gold-buys')
  @ApiOperation({ summary: 'List gold buy transactions for asset' })
  @ApiResponse({ status: 200, type: [GoldBuyDto] })
  listGoldBuys(
    @Param('boardId') boardId: string,
    @Param('assetId') assetId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assetsService.listGoldBuys(boardId, assetId, req.user.sub);
  }

  @Post(':catId/assets/:assetId/gold-buys')
  @ApiOperation({ summary: 'Log a gold buy transaction' })
  @ApiResponse({ status: 201, type: GoldBuyDto })
  createGoldBuy(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateGoldBuyDto,
  ) {
    return this.assetsService.createGoldBuy(
      boardId,
      catId,
      assetId,
      req.user.sub,
      dto,
    );
  }

  @Patch(':catId/assets/:assetId/gold-buys/:buyId')
  @ApiOperation({ summary: 'Update a gold buy transaction' })
  @ApiResponse({ status: 200, type: GoldBuyDto })
  updateGoldBuy(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Param('buyId') buyId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateGoldBuyDto,
  ) {
    return this.assetsService.updateGoldBuy(
      boardId,
      catId,
      assetId,
      buyId,
      req.user.sub,
      dto,
    );
  }

  @Delete(':catId/assets/:assetId/gold-buys/:buyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a gold buy transaction' })
  @ApiResponse({ status: 204 })
  deleteGoldBuy(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Param('buyId') buyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assetsService.deleteGoldBuy(
      boardId,
      catId,
      assetId,
      buyId,
      req.user.sub,
    );
  }

  @Get(':catId/assets/:assetId/crypto-buys')
  @ApiOperation({ summary: 'List crypto buy transactions for asset' })
  @ApiResponse({ status: 200, type: [CryptoBuyDto] })
  listCryptoBuys(
    @Param('boardId') boardId: string,
    @Param('assetId') assetId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assetsService.listCryptoBuys(boardId, assetId, req.user.sub);
  }

  @Post(':catId/assets/:assetId/crypto-buys')
  @ApiOperation({ summary: 'Log a crypto buy transaction' })
  @ApiResponse({ status: 201, type: CryptoBuyDto })
  createCryptoBuy(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCryptoBuyDto,
  ) {
    return this.assetsService.createCryptoBuy(
      boardId,
      catId,
      assetId,
      req.user.sub,
      dto,
    );
  }

  @Patch(':catId/assets/:assetId/crypto-buys/:buyId')
  @ApiOperation({ summary: 'Update a crypto buy transaction' })
  @ApiResponse({ status: 200, type: CryptoBuyDto })
  updateCryptoBuy(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Param('buyId') buyId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCryptoBuyDto,
  ) {
    return this.assetsService.updateCryptoBuy(
      boardId,
      catId,
      assetId,
      buyId,
      req.user.sub,
      dto,
    );
  }

  @Delete(':catId/assets/:assetId/crypto-buys/:buyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a crypto buy transaction' })
  @ApiResponse({ status: 204 })
  deleteCryptoBuy(
    @Param('boardId') boardId: string,
    @Param('catId') catId: string,
    @Param('assetId') assetId: string,
    @Param('buyId') buyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assetsService.deleteCryptoBuy(
      boardId,
      catId,
      assetId,
      buyId,
      req.user.sub,
    );
  }
}
