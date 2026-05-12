import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CategoryType } from '@nhabibap-myportfolio/shared-types';
import { AssetsService } from './assets.service';
import { AssetCategory } from './entities/asset-category.entity';
import { Asset } from './entities/asset.entity';
import { GoldBuy } from './entities/gold-buy.entity';
import { CryptoBuy } from './entities/crypto-buy.entity';
import { AssetEntry } from '../entries/entities/asset-entry.entity';
import { BoardsService } from '../boards/boards.service';

const userId = 'user-1';
const boardId = 'b1';
const catId = 'cat1';
const assetId = 'a1';
const buyId = 'buy1';

function makeQueryBuilder(total = 0) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: String(total) }),
  };
}

describe('AssetsService', () => {
  let service: AssetsService;
  let catRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let assetRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let entryRepo: { findOne: jest.Mock };
  let goldBuyRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let cryptoBuyRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let boardsService: { getUserRole: jest.Mock };

  beforeEach(async () => {
    catRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: catId, ...x })),
    };
    assetRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: assetId, ...x })),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };
    entryRepo = { findOne: jest.fn().mockResolvedValue(null) };
    goldBuyRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({
        id: buyId,
        createdAt: new Date('2026-01-01'),
        ...x,
      })),
      delete: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder(0)),
    };
    cryptoBuyRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({
        id: buyId,
        createdAt: new Date('2026-01-01'),
        ...x,
      })),
      delete: jest.fn().mockResolvedValue({}),
    };
    boardsService = { getUserRole: jest.fn().mockResolvedValue('OWNER') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: getRepositoryToken(AssetCategory), useValue: catRepo },
        { provide: getRepositoryToken(Asset), useValue: assetRepo },
        { provide: getRepositoryToken(AssetEntry), useValue: entryRepo },
        { provide: getRepositoryToken(GoldBuy), useValue: goldBuyRepo },
        { provide: getRepositoryToken(CryptoBuy), useValue: cryptoBuyRepo },
        { provide: BoardsService, useValue: boardsService },
      ],
    }).compile();

    service = module.get(AssetsService);
  });

  describe('access control', () => {
    it('throws ForbiddenException when not a member', async () => {
      boardsService.getUserRole.mockResolvedValueOnce(null);
      await expect(service.getCategories(boardId, userId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('getCategories', () => {
    it('maps category with totalCapital null for CASH', async () => {
      catRepo.find.mockResolvedValueOnce([
        {
          id: catId,
          boardId,
          type: CategoryType.CASH,
          assets: [{ id: assetId, categoryId: catId, name: 'VND', capital: 0 }],
        },
      ]);

      const result = await service.getCategories(boardId, userId);

      expect(result[0].totalCapital).toBeNull();
      expect(result[0].assets[0].capital).toBeNull();
    });

    it('computes profitPct from totalValue and totalCapital', async () => {
      catRepo.find.mockResolvedValueOnce([
        {
          id: catId,
          boardId,
          type: CategoryType.ETF,
          assets: [
            { id: assetId, categoryId: catId, name: 'VN30', capital: 100 },
          ],
        },
      ]);
      entryRepo.findOne.mockResolvedValueOnce({
        currentValue: 120,
        entryDate: '2026-01-01',
      });

      const result = await service.getCategories(boardId, userId);

      expect(result[0].totalCapital).toBe(100);
      expect(result[0].totalValue).toBe(120);
      expect(result[0].profitPct).toBe(20);
    });

    it('falls back to capital when no entry recorded', async () => {
      catRepo.find.mockResolvedValueOnce([
        {
          id: catId,
          boardId,
          type: CategoryType.ETF,
          assets: [
            { id: assetId, categoryId: catId, name: 'VN30', capital: 500 },
          ],
        },
      ]);
      entryRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.getCategories(boardId, userId);

      expect(result[0].totalValue).toBe(500);
    });
  });

  describe('createCategory', () => {
    it('returns existing when duplicate type', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({ id: catId });
      catRepo.findOne.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
        assets: [],
      });

      const result = await service.createCategory(boardId, userId, {
        type: CategoryType.GOLD,
      });

      expect(catRepo.save).not.toHaveBeenCalled();
      expect(result.id).toBe(catId);
    });

    it('creates new when no duplicate', async () => {
      catRepo.findOneBy.mockResolvedValueOnce(null);

      const result = await service.createCategory(boardId, userId, {
        type: CategoryType.GOLD,
      });

      expect(catRepo.create).toHaveBeenCalledWith({
        boardId,
        type: CategoryType.GOLD,
      });
      expect(catRepo.save).toHaveBeenCalled();
      expect(result.type).toBe(CategoryType.GOLD);
    });
  });

  describe('createAsset', () => {
    it('forces capital null for CASH category', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.CASH,
      });

      const result = await service.createAsset(boardId, catId, userId, {
        name: 'VND wallet',
        capital: 1000,
      });

      expect(assetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ capital: null }),
      );
      expect(result.capital).toBeNull();
    });

    it('defaults capital to 0 when omitted on non-cash', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.ETF,
      });

      await service.createAsset(boardId, catId, userId, { name: 'VN30' });

      expect(assetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ capital: 0 }),
      );
    });

    it('throws NotFound when category not in board', async () => {
      catRepo.findOneBy.mockResolvedValueOnce(null);
      await expect(
        service.createAsset(boardId, catId, userId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateAsset', () => {
    it('throws NotFound when asset missing', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.ETF,
      });
      assetRepo.findOneBy.mockResolvedValueOnce(null);
      await expect(
        service.updateAsset(boardId, catId, assetId, userId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('skips capital update for CASH category', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.CASH,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        categoryId: catId,
        name: 'old',
        capital: null,
      });

      await service.updateAsset(boardId, catId, assetId, userId, {
        capital: 999,
      });

      const savedArg = assetRepo.save.mock.calls[0][0];
      expect(savedArg.capital).toBeNull();
    });
  });

  describe('createGoldBuy', () => {
    it('increments asset.capital by amountVnd', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        categoryId: catId,
        capital: 1000,
      });

      await service.createGoldBuy(boardId, catId, assetId, userId, {
        buyDate: '2026-01-01',
        chiAmount: 1,
        amountVnd: 7000,
      });

      expect(assetRepo.update).toHaveBeenCalledWith(assetId, {
        capital: 8000,
      });
    });
  });

  describe('updateGoldBuy', () => {
    it('adjusts capital by amount diff when amountVnd changes', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
      });
      goldBuyRepo.findOneBy.mockResolvedValueOnce({
        id: buyId,
        assetId,
        buyDate: '2026-01-01',
        chiAmount: 1,
        amountVnd: 5000,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        capital: 10000,
      });

      await service.updateGoldBuy(boardId, catId, assetId, buyId, userId, {
        amountVnd: 8000,
      });

      // 10000 - 5000 + 8000 = 13000
      expect(assetRepo.update).toHaveBeenCalledWith(assetId, {
        capital: 13000,
      });
    });

    it('does not update capital when amountVnd unchanged', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
      });
      goldBuyRepo.findOneBy.mockResolvedValueOnce({
        id: buyId,
        assetId,
        buyDate: '2026-01-01',
        chiAmount: 1,
        amountVnd: 5000,
      });

      await service.updateGoldBuy(boardId, catId, assetId, buyId, userId, {
        buyDate: '2026-02-01',
      });

      expect(assetRepo.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when buy missing', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
      });
      goldBuyRepo.findOneBy.mockResolvedValueOnce(null);
      await expect(
        service.updateGoldBuy(boardId, catId, assetId, buyId, userId, {
          amountVnd: 100,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteGoldBuy', () => {
    it('clamps capital at 0 when result would be negative', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
      });
      goldBuyRepo.findOneBy.mockResolvedValueOnce({
        id: buyId,
        assetId,
        amountVnd: 5000,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        capital: 2000,
      });

      await service.deleteGoldBuy(boardId, catId, assetId, buyId, userId);

      expect(goldBuyRepo.delete).toHaveBeenCalledWith(buyId);
      expect(assetRepo.update).toHaveBeenCalledWith(assetId, { capital: 0 });
    });

    it('subtracts amountVnd from capital normally', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.GOLD,
      });
      goldBuyRepo.findOneBy.mockResolvedValueOnce({
        id: buyId,
        assetId,
        amountVnd: 3000,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        capital: 10000,
      });

      await service.deleteGoldBuy(boardId, catId, assetId, buyId, userId);

      expect(assetRepo.update).toHaveBeenCalledWith(assetId, { capital: 7000 });
    });
  });

  describe('createCryptoBuy', () => {
    it('increments asset.capital by amountVnd', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.CRYPTO,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        categoryId: catId,
        capital: 1000,
      });

      await service.createCryptoBuy(boardId, catId, assetId, userId, {
        buyDate: '2026-01-01',
        amountVnd: 5000,
      });

      expect(assetRepo.update).toHaveBeenCalledWith(assetId, {
        capital: 6000,
      });
    });
  });

  describe('deleteCryptoBuy', () => {
    it('clamps capital at 0', async () => {
      catRepo.findOneBy.mockResolvedValueOnce({
        id: catId,
        boardId,
        type: CategoryType.CRYPTO,
      });
      cryptoBuyRepo.findOneBy.mockResolvedValueOnce({
        id: buyId,
        assetId,
        amountVnd: 5000,
      });
      assetRepo.findOneBy.mockResolvedValueOnce({
        id: assetId,
        capital: 1000,
      });

      await service.deleteCryptoBuy(boardId, catId, assetId, buyId, userId);

      expect(assetRepo.update).toHaveBeenCalledWith(assetId, { capital: 0 });
    });
  });

  describe('listGoldBuys / listCryptoBuys', () => {
    it('listGoldBuys orders by buyDate DESC', async () => {
      await service.listGoldBuys(boardId, assetId, userId);
      expect(goldBuyRepo.find).toHaveBeenCalledWith({
        where: { assetId },
        order: { buyDate: 'DESC', createdAt: 'DESC' },
      });
    });

    it('listCryptoBuys orders by buyDate DESC', async () => {
      await service.listCryptoBuys(boardId, assetId, userId);
      expect(cryptoBuyRepo.find).toHaveBeenCalledWith({
        where: { assetId },
        order: { buyDate: 'DESC', createdAt: 'DESC' },
      });
    });
  });
});
