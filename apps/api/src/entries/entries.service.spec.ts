import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { AssetEntry } from './entities/asset-entry.entity';
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { Asset } from '../assets/entities/asset.entity';
import { BoardsService } from '../boards/boards.service';

const userId = 'user-1';
const boardId = 'b1';

function makeAssetIdsQb(ids: string[]) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(ids.map((id) => ({ id }))),
  };
}

function makeLatestEntriesQb(entries: unknown[]) {
  return {
    distinctOn: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(entries),
  };
}

function makeNavQb(snaps: unknown[]) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(snaps),
  };
}

describe('EntriesService', () => {
  let service: EntriesService;
  let entryRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let navRepo: {
    findOneBy: jest.Mock;
    findOneByOrFail: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let assetRepo: {
    findOneBy: jest.Mock;
    findBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let boardsService: { getUserRole: jest.Mock };

  beforeEach(async () => {
    entryRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'e-new', ...x })),
      update: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue(makeLatestEntriesQb([])),
    };
    navRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      findOneByOrFail: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'n-new', ...x })),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue(makeNavQb([])),
    };
    assetRepo = {
      findOneBy: jest
        .fn()
        .mockImplementation(({ id }: { id: string }) =>
          Promise.resolve({ id, name: `asset-${id}`, capital: 0 }),
        ),
      findBy: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(makeAssetIdsQb([])),
    };
    boardsService = { getUserRole: jest.fn().mockResolvedValue('OWNER') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        { provide: getRepositoryToken(AssetEntry), useValue: entryRepo },
        { provide: getRepositoryToken(NavSnapshot), useValue: navRepo },
        { provide: getRepositoryToken(Asset), useValue: assetRepo },
        { provide: BoardsService, useValue: boardsService },
      ],
    }).compile();

    service = module.get(EntriesService);
  });

  describe('access control', () => {
    it('throws ForbiddenException when not a member', async () => {
      boardsService.getUserRole.mockResolvedValueOnce(null);
      await expect(
        service.getLatestEntries(boardId, userId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('submitEntries', () => {
    it('updates existing entry when found for date+asset', async () => {
      entryRepo.findOneBy.mockResolvedValueOnce({
        id: 'e1',
        assetId: 'a1',
        entryDate: '2026-01-01',
        currentValue: 100,
        notes: null,
        createdById: userId,
      });

      await service.submitEntries(boardId, userId, {
        date: '2026-01-01',
        entries: [{ assetId: 'a1', currentValue: 200 }],
      });

      expect(entryRepo.update).toHaveBeenCalledWith('e1', {
        currentValue: 200,
        notes: null,
      });
      expect(entryRepo.save).not.toHaveBeenCalled();
    });

    it('creates new entry when none exists for date+asset', async () => {
      entryRepo.findOneBy.mockResolvedValueOnce(null);

      await service.submitEntries(boardId, userId, {
        date: '2026-01-01',
        entries: [{ assetId: 'a1', currentValue: 200, notes: 'note' }],
      });

      expect(entryRepo.create).toHaveBeenCalledWith({
        assetId: 'a1',
        entryDate: '2026-01-01',
        currentValue: 200,
        notes: 'note',
        createdById: userId,
      });
      expect(entryRepo.save).toHaveBeenCalled();
    });

    it('upserts nav snapshot for date after entries saved', async () => {
      entryRepo.findOneBy.mockResolvedValueOnce(null);

      await service.submitEntries(boardId, userId, {
        date: '2026-01-01',
        entries: [{ assetId: 'a1', currentValue: 200 }],
      });

      expect(navRepo.create).toHaveBeenCalled();
    });
  });

  describe('getLatestEntries', () => {
    it('returns empty array short-circuit when board has no assets', async () => {
      assetRepo.createQueryBuilder.mockReturnValueOnce(makeAssetIdsQb([]));

      const result = await service.getLatestEntries(boardId, userId);

      expect(result).toEqual([]);
      expect(entryRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries entries when assets exist', async () => {
      assetRepo.createQueryBuilder.mockReturnValueOnce(makeAssetIdsQb(['a1']));
      entryRepo.createQueryBuilder.mockReturnValueOnce(
        makeLatestEntriesQb([
          {
            id: 'e1',
            assetId: 'a1',
            entryDate: '2026-01-01',
            currentValue: 100,
            notes: null,
            createdById: userId,
          },
        ]),
      );

      const result = await service.getLatestEntries(boardId, userId);

      expect(result.length).toBe(1);
      expect(result[0].currentValue).toBe(100);
    });
  });

  describe('getNavHistory', () => {
    it('applies from/to filters via queryBuilder', async () => {
      const qb = makeNavQb([]);
      navRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.getNavHistory(
        boardId,
        userId,
        '2026-01-01',
        '2026-12-31',
      );

      expect(qb.andWhere).toHaveBeenCalledWith('n.snapshotDate >= :from', {
        from: '2026-01-01',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('n.snapshotDate <= :to', {
        to: '2026-12-31',
      });
    });

    it('computes periodGrowth from previous snapshot', async () => {
      navRepo.createQueryBuilder.mockReturnValueOnce(
        makeNavQb([
          {
            id: 's1',
            boardId,
            snapshotDate: '2026-01-31',
            totalCapital: '1000',
            totalValue: '1000',
          },
          {
            id: 's2',
            boardId,
            snapshotDate: '2026-02-28',
            totalCapital: '1000',
            totalValue: '1100',
          },
        ]),
      );

      const result = await service.getNavHistory(boardId, userId);

      expect(result[0].periodGrowth).toBeNull();
      expect(result[1].periodGrowth).toBeCloseTo(10);
      expect(result[1].profit).toBe(100);
      expect(result[1].profitPct).toBe(10);
    });

    it('aggregates by yearly granularity (keeps last snapshot per year)', async () => {
      navRepo.createQueryBuilder.mockReturnValueOnce(
        makeNavQb([
          {
            id: 's1',
            boardId,
            snapshotDate: '2025-01-31',
            totalCapital: '0',
            totalValue: '100',
          },
          {
            id: 's2',
            boardId,
            snapshotDate: '2025-12-31',
            totalCapital: '0',
            totalValue: '200',
          },
          {
            id: 's3',
            boardId,
            snapshotDate: '2026-06-30',
            totalCapital: '0',
            totalValue: '300',
          },
        ]),
      );

      const result = await service.getNavHistory(
        boardId,
        userId,
        undefined,
        undefined,
        'yearly',
      );

      expect(result.length).toBe(2);
      expect(result[0].totalValue).toBe(200);
      expect(result[1].totalValue).toBe(300);
    });

    it('aggregates by quarterly granularity', async () => {
      navRepo.createQueryBuilder.mockReturnValueOnce(
        makeNavQb([
          {
            id: 's1',
            boardId,
            snapshotDate: '2026-01-31',
            totalCapital: '0',
            totalValue: '100',
          },
          {
            id: 's2',
            boardId,
            snapshotDate: '2026-03-31',
            totalCapital: '0',
            totalValue: '150',
          },
          {
            id: 's3',
            boardId,
            snapshotDate: '2026-04-30',
            totalCapital: '0',
            totalValue: '200',
          },
        ]),
      );

      const result = await service.getNavHistory(
        boardId,
        userId,
        undefined,
        undefined,
        'quarterly',
      );

      expect(result.length).toBe(2);
      expect(result[0].totalValue).toBe(150);
      expect(result[1].totalValue).toBe(200);
    });

    it('zero totalCapital → profitPct 0, periodGrowth null', async () => {
      navRepo.createQueryBuilder.mockReturnValueOnce(
        makeNavQb([
          {
            id: 's1',
            boardId,
            snapshotDate: '2026-01-31',
            totalCapital: '0',
            totalValue: '0',
          },
        ]),
      );

      const result = await service.getNavHistory(boardId, userId);

      expect(result[0].profitPct).toBe(0);
      expect(result[0].periodGrowth).toBeNull();
    });
  });

  describe('upsertManualNavSnapshot', () => {
    it('derives totalCapital from assets when omitted', async () => {
      assetRepo.createQueryBuilder.mockReturnValueOnce(
        makeAssetIdsQb(['a1', 'a2']),
      );
      assetRepo.findBy.mockResolvedValueOnce([
        { id: 'a1', capital: 1000 },
        { id: 'a2', capital: 500 },
      ]);
      navRepo.findOneBy.mockResolvedValueOnce(null);
      navRepo.findOneByOrFail.mockResolvedValueOnce({
        id: 'n1',
        boardId,
        snapshotDate: '2026-01-01',
        totalCapital: '1500',
        totalValue: '2000',
      });

      const result = await service.upsertManualNavSnapshot(boardId, userId, {
        date: '2026-01-01',
        totalValue: 2000,
      });

      expect(navRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalCapital: 1500, totalValue: 2000 }),
      );
      expect(result.totalCapital).toBe(1500);
      expect(result.profit).toBe(500);
    });

    it('uses provided totalCapital when explicit', async () => {
      navRepo.findOneBy.mockResolvedValueOnce(null);
      navRepo.findOneByOrFail.mockResolvedValueOnce({
        id: 'n1',
        boardId,
        snapshotDate: '2026-01-01',
        totalCapital: '999',
        totalValue: '2000',
      });

      await service.upsertManualNavSnapshot(boardId, userId, {
        date: '2026-01-01',
        totalValue: 2000,
        totalCapital: 999,
      });

      expect(assetRepo.findBy).not.toHaveBeenCalled();
      expect(navRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalCapital: 999 }),
      );
    });

    it('updates existing snapshot when one exists for date', async () => {
      navRepo.findOneBy.mockResolvedValueOnce({ id: 'n-existing' });
      navRepo.findOneByOrFail.mockResolvedValueOnce({
        id: 'n-existing',
        boardId,
        snapshotDate: '2026-01-01',
        totalCapital: '500',
        totalValue: '1000',
      });

      await service.upsertManualNavSnapshot(boardId, userId, {
        date: '2026-01-01',
        totalValue: 1000,
        totalCapital: 500,
      });

      expect(navRepo.update).toHaveBeenCalledWith('n-existing', {
        totalCapital: 500,
        totalValue: 1000,
      });
      expect(navRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteNavSnapshot', () => {
    it('delegates to navRepo.delete with id+boardId', async () => {
      await service.deleteNavSnapshot(boardId, userId, 'n1');
      expect(navRepo.delete).toHaveBeenCalledWith({ id: 'n1', boardId });
    });
  });
});
