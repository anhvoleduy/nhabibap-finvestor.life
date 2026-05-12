import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType } from '@nhabibap-myportfolio/shared-types';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';

const userId = 'user-1';
const boardId = 'b1';
const catId = 'cat1';
const assetId = 'a1';
const buyId = 'buy1';
const req = { user: { sub: userId, email: 't@e.com' } } as AuthenticatedRequest;

const mockCategory = {
  id: catId,
  boardId,
  type: CategoryType.GOLD,
  label: 'Vàng',
  assets: [],
  totalCapital: null,
  totalValue: 0,
  profitPct: null,
};
const mockAsset = {
  id: assetId,
  categoryId: catId,
  name: 'SJC',
  capital: 1000,
  metadata: null,
  currentValue: null,
  profit: null,
  profitPct: null,
  lastEntryDate: null,
  totalChi: null,
};
const mockGoldBuy = {
  id: buyId,
  assetId,
  buyDate: '2026-01-01',
  chiAmount: 1,
  amountVnd: 7000000,
  createdAt: new Date().toISOString(),
};
const mockCryptoBuy = {
  id: buyId,
  assetId,
  buyDate: '2026-01-01',
  amountVnd: 5000000,
  createdAt: new Date().toISOString(),
};

describe('AssetsController', () => {
  let controller: AssetsController;
  let service: jest.Mocked<AssetsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: {
            getCategories: jest.fn().mockResolvedValue([mockCategory]),
            createCategory: jest.fn().mockResolvedValue(mockCategory),
            createAsset: jest.fn().mockResolvedValue(mockAsset),
            updateAsset: jest.fn().mockResolvedValue(mockAsset),
            deleteAsset: jest.fn().mockResolvedValue(undefined),
            listGoldBuys: jest.fn().mockResolvedValue([mockGoldBuy]),
            createGoldBuy: jest.fn().mockResolvedValue(mockGoldBuy),
            updateGoldBuy: jest.fn().mockResolvedValue(mockGoldBuy),
            deleteGoldBuy: jest.fn().mockResolvedValue(undefined),
            listCryptoBuys: jest.fn().mockResolvedValue([mockCryptoBuy]),
            createCryptoBuy: jest.fn().mockResolvedValue(mockCryptoBuy),
            updateCryptoBuy: jest.fn().mockResolvedValue(mockCryptoBuy),
            deleteCryptoBuy: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AssetsController);
    service = module.get(AssetsService);
  });

  describe('categories', () => {
    it('list delegates to getCategories', async () => {
      const result = await controller.list(boardId, req);
      expect(service.getCategories).toHaveBeenCalledWith(boardId, userId);
      expect(result).toEqual([mockCategory]);
    });

    it('createCategory delegates with dto', async () => {
      const dto = { type: CategoryType.GOLD };
      const result = await controller.createCategory(boardId, req, dto);
      expect(service.createCategory).toHaveBeenCalledWith(boardId, userId, dto);
      expect(result).toBe(mockCategory);
    });
  });

  describe('assets', () => {
    it('createAsset delegates with dto', async () => {
      const dto = { name: 'SJC', capital: 1000 };
      const result = await controller.createAsset(boardId, catId, req, dto);
      expect(service.createAsset).toHaveBeenCalledWith(
        boardId,
        catId,
        userId,
        dto,
      );
      expect(result).toBe(mockAsset);
    });

    it('updateAsset delegates with all ids + dto', async () => {
      const dto = { name: 'New name' };
      const result = await controller.updateAsset(
        boardId,
        catId,
        assetId,
        req,
        dto,
      );
      expect(service.updateAsset).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        userId,
        dto,
      );
      expect(result).toBe(mockAsset);
    });

    it('deleteAsset delegates with all ids', async () => {
      await controller.deleteAsset(boardId, catId, assetId, req);
      expect(service.deleteAsset).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        userId,
      );
    });
  });

  describe('gold buys', () => {
    it('listGoldBuys delegates', async () => {
      const result = await controller.listGoldBuys(boardId, assetId, req);
      expect(service.listGoldBuys).toHaveBeenCalledWith(
        boardId,
        assetId,
        userId,
      );
      expect(result).toEqual([mockGoldBuy]);
    });

    it('createGoldBuy delegates with dto', async () => {
      const dto = { buyDate: '2026-01-01', chiAmount: 1, amountVnd: 7000000 };
      const result = await controller.createGoldBuy(
        boardId,
        catId,
        assetId,
        req,
        dto,
      );
      expect(service.createGoldBuy).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        userId,
        dto,
      );
      expect(result).toBe(mockGoldBuy);
    });

    it('updateGoldBuy delegates with buyId + dto', async () => {
      const dto = { amountVnd: 8000000 };
      const result = await controller.updateGoldBuy(
        boardId,
        catId,
        assetId,
        buyId,
        req,
        dto,
      );
      expect(service.updateGoldBuy).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        buyId,
        userId,
        dto,
      );
      expect(result).toBe(mockGoldBuy);
    });

    it('deleteGoldBuy delegates', async () => {
      await controller.deleteGoldBuy(boardId, catId, assetId, buyId, req);
      expect(service.deleteGoldBuy).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        buyId,
        userId,
      );
    });
  });

  describe('crypto buys', () => {
    it('listCryptoBuys delegates', async () => {
      const result = await controller.listCryptoBuys(boardId, assetId, req);
      expect(service.listCryptoBuys).toHaveBeenCalledWith(
        boardId,
        assetId,
        userId,
      );
      expect(result).toEqual([mockCryptoBuy]);
    });

    it('createCryptoBuy delegates with dto', async () => {
      const dto = { buyDate: '2026-01-01', amountVnd: 5000000 };
      const result = await controller.createCryptoBuy(
        boardId,
        catId,
        assetId,
        req,
        dto,
      );
      expect(service.createCryptoBuy).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        userId,
        dto,
      );
      expect(result).toBe(mockCryptoBuy);
    });

    it('updateCryptoBuy delegates with buyId + dto', async () => {
      const dto = { amountVnd: 6000000 };
      const result = await controller.updateCryptoBuy(
        boardId,
        catId,
        assetId,
        buyId,
        req,
        dto,
      );
      expect(service.updateCryptoBuy).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        buyId,
        userId,
        dto,
      );
      expect(result).toBe(mockCryptoBuy);
    });

    it('deleteCryptoBuy delegates', async () => {
      await controller.deleteCryptoBuy(boardId, catId, assetId, buyId, req);
      expect(service.deleteCryptoBuy).toHaveBeenCalledWith(
        boardId,
        catId,
        assetId,
        buyId,
        userId,
      );
    });
  });
});
