import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetCategory } from './entities/asset-category.entity';
import { Asset } from './entities/asset.entity';
import { GoldBuy } from './entities/gold-buy.entity';
import { CryptoBuy } from './entities/crypto-buy.entity';
import { AssetEntry } from '../entries/entities/asset-entry.entity';
import { BoardsService } from '../boards/boards.service';
import {
  AssetCategoryDto,
  AssetDto,
  CATEGORY_LABELS,
  CategoryType,
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

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(AssetCategory)
    private readonly catRepo: Repository<AssetCategory>,
    @InjectRepository(Asset) private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetEntry)
    private readonly entryRepo: Repository<AssetEntry>,
    @InjectRepository(GoldBuy)
    private readonly goldBuyRepo: Repository<GoldBuy>,
    @InjectRepository(CryptoBuy)
    private readonly cryptoBuyRepo: Repository<CryptoBuy>,
    private readonly boardsService: BoardsService,
  ) {}

  async getCategories(
    boardId: string,
    userId: string,
  ): Promise<AssetCategoryDto[]> {
    await this.assertMember(boardId, userId);
    const cats = await this.catRepo.find({
      where: { boardId },
      relations: ['assets'],
    });

    return Promise.all(cats.map((cat) => this.mapCategory(cat)));
  }

  async createCategory(
    boardId: string,
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<AssetCategoryDto> {
    await this.assertMember(boardId, userId);
    const existing = await this.catRepo.findOneBy({ boardId, type: dto.type });
    if (existing)
      return this.mapCategory(
        (await this.catRepo.findOne({
          where: { id: existing.id },
          relations: ['assets'],
        })) as AssetCategory,
      );
    const cat = this.catRepo.create({ boardId, type: dto.type });
    const saved = await this.catRepo.save(cat);
    return this.mapCategory({ ...saved, assets: [] });
  }

  async createAsset(
    boardId: string,
    catId: string,
    userId: string,
    dto: CreateAssetDto,
  ): Promise<AssetDto> {
    await this.assertMember(boardId, userId);
    const cat = await this.assertCategoryInBoard(catId, boardId);
    const isCash = cat.type === CategoryType.CASH;
    const asset = this.assetRepo.create({
      categoryId: catId,
      name: dto.name,
      capital: isCash ? null : (dto.capital ?? 0),
      metadata: dto.metadata ?? null,
    });
    const saved = await this.assetRepo.save(asset);
    return this.mapAsset(saved, null, null, isCash);
  }

  async updateAsset(
    boardId: string,
    catId: string,
    assetId: string,
    userId: string,
    dto: UpdateAssetDto,
  ): Promise<AssetDto> {
    await this.assertMember(boardId, userId);
    const cat = await this.assertCategoryInBoard(catId, boardId);
    const isCash = cat.type === CategoryType.CASH;
    const asset = await this.assetRepo.findOneBy({
      id: assetId,
      categoryId: catId,
    });
    if (!asset) throw new NotFoundException();
    if (dto.name !== undefined) asset.name = dto.name;
    if (!isCash && dto.capital !== undefined) asset.capital = dto.capital;
    if (dto.metadata !== undefined) asset.metadata = dto.metadata ?? null;
    const saved = await this.assetRepo.save(asset);
    return this.mapAsset(
      saved,
      await this.getLatestEntry(assetId),
      null,
      isCash,
    );
  }

  async deleteAsset(
    boardId: string,
    catId: string,
    assetId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    await this.assetRepo.delete({ id: assetId, categoryId: catId });
  }

  async listGoldBuys(
    boardId: string,
    assetId: string,
    userId: string,
  ): Promise<GoldBuyDto[]> {
    await this.assertMember(boardId, userId);
    const buys = await this.goldBuyRepo.find({
      where: { assetId },
      order: { buyDate: 'DESC', createdAt: 'DESC' },
    });
    return buys.map((b) => this.mapGoldBuy(b));
  }

  async createGoldBuy(
    boardId: string,
    catId: string,
    assetId: string,
    userId: string,
    dto: CreateGoldBuyDto,
  ): Promise<GoldBuyDto> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    const asset = await this.assetRepo.findOneBy({
      id: assetId,
      categoryId: catId,
    });
    if (!asset) throw new NotFoundException();
    const buy = this.goldBuyRepo.create({
      assetId,
      buyDate: dto.buyDate,
      chiAmount: dto.chiAmount,
      amountVnd: dto.amountVnd,
    });
    const saved = await this.goldBuyRepo.save(buy);
    await this.assetRepo.update(assetId, {
      capital: Number(asset.capital) + dto.amountVnd,
    });
    return this.mapGoldBuy(saved);
  }

  async updateGoldBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
    userId: string,
    dto: UpdateGoldBuyDto,
  ): Promise<GoldBuyDto> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    const buy = await this.goldBuyRepo.findOneBy({ id: buyId, assetId });
    if (!buy) throw new NotFoundException();
    const oldAmountVnd = Number(buy.amountVnd);
    if (dto.buyDate !== undefined) buy.buyDate = dto.buyDate;
    if (dto.chiAmount !== undefined) buy.chiAmount = dto.chiAmount;
    if (dto.amountVnd !== undefined) buy.amountVnd = dto.amountVnd;
    const saved = await this.goldBuyRepo.save(buy);
    if (dto.amountVnd !== undefined) {
      const asset = await this.assetRepo.findOneBy({ id: assetId });
      if (asset) {
        await this.assetRepo.update(assetId, {
          capital: Math.max(
            0,
            Number(asset.capital) - oldAmountVnd + dto.amountVnd,
          ),
        });
      }
    }
    return this.mapGoldBuy(saved);
  }

  async deleteGoldBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    const buy = await this.goldBuyRepo.findOneBy({ id: buyId, assetId });
    if (!buy) throw new NotFoundException();
    await this.goldBuyRepo.delete(buyId);
    const asset = await this.assetRepo.findOneBy({ id: assetId });
    if (asset) {
      await this.assetRepo.update(assetId, {
        capital: Math.max(0, Number(asset.capital) - Number(buy.amountVnd)),
      });
    }
  }

  async listCryptoBuys(
    boardId: string,
    assetId: string,
    userId: string,
  ): Promise<CryptoBuyDto[]> {
    await this.assertMember(boardId, userId);
    const buys = await this.cryptoBuyRepo.find({
      where: { assetId },
      order: { buyDate: 'DESC', createdAt: 'DESC' },
    });
    return buys.map((b) => this.mapCryptoBuy(b));
  }

  async createCryptoBuy(
    boardId: string,
    catId: string,
    assetId: string,
    userId: string,
    dto: CreateCryptoBuyDto,
  ): Promise<CryptoBuyDto> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    const asset = await this.assetRepo.findOneBy({
      id: assetId,
      categoryId: catId,
    });
    if (!asset) throw new NotFoundException();
    const buy = this.cryptoBuyRepo.create({
      assetId,
      buyDate: dto.buyDate,
      amountVnd: dto.amountVnd,
    });
    const saved = await this.cryptoBuyRepo.save(buy);
    await this.assetRepo.update(assetId, {
      capital: Number(asset.capital) + dto.amountVnd,
    });
    return this.mapCryptoBuy(saved);
  }

  async updateCryptoBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
    userId: string,
    dto: UpdateCryptoBuyDto,
  ): Promise<CryptoBuyDto> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    const buy = await this.cryptoBuyRepo.findOneBy({ id: buyId, assetId });
    if (!buy) throw new NotFoundException();
    const oldAmountVnd = Number(buy.amountVnd);
    if (dto.buyDate !== undefined) buy.buyDate = dto.buyDate;
    if (dto.amountVnd !== undefined) buy.amountVnd = dto.amountVnd;
    const saved = await this.cryptoBuyRepo.save(buy);
    if (dto.amountVnd !== undefined) {
      const asset = await this.assetRepo.findOneBy({ id: assetId });
      if (asset) {
        await this.assetRepo.update(assetId, {
          capital: Math.max(
            0,
            Number(asset.capital) - oldAmountVnd + dto.amountVnd,
          ),
        });
      }
    }
    return this.mapCryptoBuy(saved);
  }

  async deleteCryptoBuy(
    boardId: string,
    catId: string,
    assetId: string,
    buyId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(boardId, userId);
    await this.assertCategoryInBoard(catId, boardId);
    const buy = await this.cryptoBuyRepo.findOneBy({ id: buyId, assetId });
    if (!buy) throw new NotFoundException();
    await this.cryptoBuyRepo.delete(buyId);
    const asset = await this.assetRepo.findOneBy({ id: assetId });
    if (asset) {
      await this.assetRepo.update(assetId, {
        capital: Math.max(0, Number(asset.capital) - Number(buy.amountVnd)),
      });
    }
  }

  private mapCryptoBuy(buy: CryptoBuy): CryptoBuyDto {
    return {
      id: buy.id,
      assetId: buy.assetId,
      buyDate: buy.buyDate,
      amountVnd: Number(buy.amountVnd),
      createdAt: buy.createdAt.toISOString(),
    };
  }

  private mapGoldBuy(buy: GoldBuy): GoldBuyDto {
    return {
      id: buy.id,
      assetId: buy.assetId,
      buyDate: buy.buyDate,
      chiAmount: Number(buy.chiAmount),
      amountVnd: Number(buy.amountVnd),
      createdAt: buy.createdAt.toISOString(),
    };
  }

  private async mapCategory(cat: AssetCategory): Promise<AssetCategoryDto> {
    const isGold = cat.type === CategoryType.GOLD;
    const isCash = cat.type === CategoryType.CASH;
    const assets = await Promise.all(
      cat.assets.map(async (a) => {
        const latestEntry = await this.getLatestEntry(a.id);
        const totalChi = isGold ? await this.getTotalChi(a.id) : null;
        return this.mapAsset(a, latestEntry, totalChi, isCash);
      }),
    );
    const totalCapital = isCash
      ? null
      : assets.reduce((s, a) => s + Number(a.capital ?? 0), 0);
    const totalValue = assets.reduce(
      (s, a) => s + Number(a.currentValue ?? (isCash ? 0 : (a.capital ?? 0))),
      0,
    );
    return {
      id: cat.id,
      boardId: cat.boardId,
      type: cat.type as CategoryType,
      label: CATEGORY_LABELS[cat.type as CategoryType],
      assets,
      totalCapital,
      totalValue,
      profitPct:
        totalCapital !== null && totalCapital > 0
          ? ((totalValue - totalCapital) / totalCapital) * 100
          : null,
    };
  }

  private mapAsset(
    asset: Asset,
    latestEntry: AssetEntry | null,
    totalChi: number | null = null,
    isCash = false,
  ): AssetDto {
    const capital = isCash ? null : Number(asset.capital ?? 0);
    const currentValue = latestEntry ? Number(latestEntry.currentValue) : null;
    const profit =
      !isCash && capital !== null && currentValue !== null
        ? currentValue - capital
        : null;
    const profitPct =
      profit !== null && capital !== null && capital > 0
        ? (profit / capital) * 100
        : null;
    return {
      id: asset.id,
      categoryId: asset.categoryId,
      name: asset.name,
      capital,
      metadata: asset.metadata,
      currentValue,
      profit,
      profitPct,
      lastEntryDate: latestEntry?.entryDate ?? null,
      totalChi,
    };
  }

  private async getTotalChi(assetId: string): Promise<number> {
    const result = await this.goldBuyRepo
      .createQueryBuilder('gb')
      .select('COALESCE(SUM(gb.chiAmount), 0)', 'total')
      .where('gb.assetId = :assetId', { assetId })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  private async getLatestEntry(assetId: string): Promise<AssetEntry | null> {
    return this.entryRepo.findOne({
      where: { assetId },
      order: { entryDate: 'DESC' },
    });
  }

  private async assertMember(boardId: string, userId: string): Promise<void> {
    const role = await this.boardsService.getUserRole(boardId, userId);
    if (!role) throw new ForbiddenException();
  }

  private async assertCategoryInBoard(
    catId: string,
    boardId: string,
  ): Promise<AssetCategory> {
    const cat = await this.catRepo.findOneBy({ id: catId, boardId });
    if (!cat) throw new NotFoundException('Category not found in board');
    return cat;
  }
}
