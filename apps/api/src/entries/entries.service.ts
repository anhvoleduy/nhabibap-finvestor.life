import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntry } from './entities/asset-entry.entity';
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { Asset } from '../assets/entities/asset.entity';
import { BoardsService } from '../boards/boards.service';
import {
  AssetEntryDto,
  DailyEntriesDto,
  NavSnapshotDto,
  SubmitEntriesDto,
  UpsertNavSnapshotDto,
} from '@nhabibap-myportfolio/shared-types';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(AssetEntry)
    private readonly entryRepo: Repository<AssetEntry>,
    @InjectRepository(NavSnapshot)
    private readonly navRepo: Repository<NavSnapshot>,
    @InjectRepository(Asset) private readonly assetRepo: Repository<Asset>,
    private readonly boardsService: BoardsService,
  ) {}

  async submitEntries(
    boardId: string,
    userId: string,
    dto: SubmitEntriesDto,
  ): Promise<DailyEntriesDto> {
    await this.assertMember(boardId, userId);

    const saved: AssetEntry[] = [];
    for (const e of dto.entries) {
      const existing = await this.entryRepo.findOneBy({
        assetId: e.assetId,
        entryDate: dto.date,
      });
      if (existing) {
        await this.entryRepo.update(existing.id, {
          currentValue: e.currentValue,
          notes: e.notes ?? null,
        });
        saved.push({
          ...existing,
          currentValue: e.currentValue,
          notes: e.notes ?? null,
        });
      } else {
        const entry = this.entryRepo.create({
          assetId: e.assetId,
          entryDate: dto.date,
          currentValue: e.currentValue,
          notes: e.notes ?? null,
          createdById: userId,
        });
        saved.push(await this.entryRepo.save(entry));
      }
    }

    await this.upsertNavSnapshot(boardId, dto.date);

    return {
      date: dto.date,
      entries: await this.toEntryDtos(saved),
    };
  }

  async getEntriesForDate(
    boardId: string,
    userId: string,
    date: string,
  ): Promise<DailyEntriesDto> {
    await this.assertMember(boardId, userId);
    const assetIds = await this.getBoardAssetIds(boardId);
    const entries = await this.entryRepo.find({
      where: assetIds.map((id) => ({ assetId: id, entryDate: date })),
    });
    return { date, entries: await this.toEntryDtos(entries) };
  }

  async getLatestEntries(
    boardId: string,
    userId: string,
  ): Promise<AssetEntryDto[]> {
    await this.assertMember(boardId, userId);
    const assetIds = await this.getBoardAssetIds(boardId);
    if (assetIds.length === 0) return [];

    const entries = await this.entryRepo
      .createQueryBuilder('e')
      .distinctOn(['e.assetId'])
      .where('e.assetId IN (:...ids)', { ids: assetIds })
      .orderBy('e.assetId')
      .addOrderBy('e.entryDate', 'DESC')
      .getMany();

    return this.toEntryDtos(entries);
  }

  async getNavHistory(
    boardId: string,
    userId: string,
    from?: string,
    to?: string,
    granularity?: 'monthly' | 'quarterly' | 'yearly',
  ): Promise<NavSnapshotDto[]> {
    await this.assertMember(boardId, userId);

    // Always keep today's snapshot in sync with live asset values
    const today = new Date().toISOString().split('T')[0];
    await this.upsertNavSnapshot(boardId, today);

    const qb = this.navRepo
      .createQueryBuilder('n')
      .where('n.boardId = :boardId', { boardId });
    if (from) qb.andWhere('n.snapshotDate >= :from', { from });
    if (to) qb.andWhere('n.snapshotDate <= :to', { to });
    const all = await qb.orderBy('n.snapshotDate', 'ASC').getMany();

    const snaps = granularity ? this.aggregateByPeriod(all, granularity) : all;

    return snaps.map((s, i) => {
      const totalCapital = Number(s.totalCapital);
      const totalValue = Number(s.totalValue);
      const profit = totalValue - totalCapital;
      const profitPct = totalCapital > 0 ? (profit / totalCapital) * 100 : 0;
      const prev = i > 0 ? Number(snaps[i - 1].totalValue) : null;
      const periodGrowth =
        prev && prev > 0 ? ((totalValue - prev) / prev) * 100 : null;
      return {
        id: s.id,
        boardId: s.boardId,
        snapshotDate: s.snapshotDate,
        totalCapital,
        totalValue,
        profit,
        profitPct,
        periodGrowth,
      };
    });
  }

  async upsertManualNavSnapshot(
    boardId: string,
    userId: string,
    dto: UpsertNavSnapshotDto,
  ): Promise<NavSnapshotDto> {
    await this.assertMember(boardId, userId);

    let totalCapital = dto.totalCapital;
    if (totalCapital === undefined) {
      const assetIds = await this.getBoardAssetIds(boardId);
      const assets = assetIds.length
        ? await this.assetRepo.findBy(assetIds.map((id) => ({ id })))
        : [];
      totalCapital = assets.reduce((s, a) => s + Number(a.capital), 0);
    }

    const existing = await this.navRepo.findOneBy({
      boardId,
      snapshotDate: dto.date,
    });
    if (existing) {
      await this.navRepo.update(existing.id, {
        totalCapital,
        totalValue: dto.totalValue,
      });
    } else {
      await this.navRepo.save(
        this.navRepo.create({
          boardId,
          snapshotDate: dto.date,
          totalCapital,
          totalValue: dto.totalValue,
        }),
      );
    }

    const snap = await this.navRepo.findOneByOrFail({
      boardId,
      snapshotDate: dto.date,
    });
    const totalValue = Number(snap.totalValue);
    const cap = Number(snap.totalCapital);
    const profit = totalValue - cap;
    return {
      id: snap.id,
      boardId: snap.boardId,
      snapshotDate: snap.snapshotDate,
      totalCapital: cap,
      totalValue,
      profit,
      profitPct: cap > 0 ? (profit / cap) * 100 : 0,
      periodGrowth: null,
    };
  }

  async deleteNavSnapshot(
    boardId: string,
    userId: string,
    snapshotId: string,
  ): Promise<void> {
    await this.assertMember(boardId, userId);
    await this.navRepo.delete({ id: snapshotId, boardId });
  }

  private async upsertNavSnapshot(
    boardId: string,
    date: string,
  ): Promise<void> {
    const assetIds = await this.getBoardAssetIds(boardId);
    const assets = await this.assetRepo.findBy(assetIds.map((id) => ({ id })));
    const totalCapital = assets.reduce((s, a) => s + Number(a.capital), 0);

    const latestEntries =
      assetIds.length === 0
        ? []
        : await this.entryRepo
            .createQueryBuilder('e')
            .distinctOn(['e.assetId'])
            .where('e.assetId IN (:...ids)', { ids: assetIds })
            .orderBy('e.assetId')
            .addOrderBy('e.entryDate', 'DESC')
            .getMany();

    const entryByAssetId = new Map(latestEntries.map((e) => [e.assetId, e]));
    const totalValue = assets.reduce((s, a) => {
      const entry = entryByAssetId.get(a.id);
      return s + (entry ? Number(entry.currentValue) : Number(a.capital));
    }, 0);

    const existing = await this.navRepo.findOneBy({
      boardId,
      snapshotDate: date,
    });
    if (existing) {
      await this.navRepo.update(existing.id, { totalCapital, totalValue });
    } else {
      await this.navRepo.save(
        this.navRepo.create({
          boardId,
          snapshotDate: date,
          totalCapital,
          totalValue,
        }),
      );
    }
  }

  private aggregateByPeriod(
    snaps: NavSnapshot[],
    granularity: 'monthly' | 'quarterly' | 'yearly',
  ): NavSnapshot[] {
    const periodKey = (s: NavSnapshot): string => {
      const [year, month] = s.snapshotDate.split('-').map(Number);
      if (granularity === 'yearly') return `${year}`;
      if (granularity === 'quarterly')
        return `${year}-Q${Math.ceil(month / 3)}`;
      return `${year}-${String(month).padStart(2, '0')}`;
    };
    const map = new Map<string, NavSnapshot>();
    for (const s of snaps) map.set(periodKey(s), s);
    return Array.from(map.values());
  }

  private async getBoardAssetIds(boardId: string): Promise<string[]> {
    const assets = await this.assetRepo
      .createQueryBuilder('a')
      .innerJoin('a.category', 'c')
      .where('c.boardId = :boardId', { boardId })
      .select('a.id')
      .getMany();
    return assets.map((a) => a.id);
  }

  private async toEntryDtos(entries: AssetEntry[]): Promise<AssetEntryDto[]> {
    return Promise.all(
      entries.map(async (e) => {
        const asset = await this.assetRepo.findOneBy({ id: e.assetId });
        return {
          id: e.id,
          assetId: e.assetId,
          assetName: asset?.name ?? '',
          entryDate: e.entryDate,
          currentValue: Number(e.currentValue),
          notes: e.notes,
          createdBy: e.createdById ?? '',
        };
      }),
    );
  }

  private async assertMember(boardId: string, userId: string): Promise<void> {
    const role = await this.boardsService.getUserRole(boardId, userId);
    if (!role) throw new ForbiddenException();
  }
}
