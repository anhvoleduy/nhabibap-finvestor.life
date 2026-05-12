import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';

const userId = 'user-1';
const boardId = 'b1';
const req = { user: { sub: userId, email: 't@e.com' } } as AuthenticatedRequest;

const mockEntry = {
  id: 'e1',
  assetId: 'a1',
  assetName: 'SJC',
  entryDate: '2026-01-01',
  currentValue: 1000,
  notes: null,
  createdBy: userId,
};
const mockDaily = { date: '2026-01-01', entries: [mockEntry] };
const mockNav = {
  id: 'n1',
  boardId,
  snapshotDate: '2026-01-01',
  totalCapital: 1000,
  totalValue: 1200,
  profit: 200,
  profitPct: 20,
  periodGrowth: null,
};

describe('EntriesController', () => {
  let controller: EntriesController;
  let service: jest.Mocked<EntriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: {
            submitEntries: jest.fn().mockResolvedValue(mockDaily),
            getLatestEntries: jest.fn().mockResolvedValue([mockEntry]),
            getEntriesForDate: jest.fn().mockResolvedValue(mockDaily),
            getNavHistory: jest.fn().mockResolvedValue([mockNav]),
            upsertManualNavSnapshot: jest.fn().mockResolvedValue(mockNav),
            deleteNavSnapshot: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(EntriesController);
    service = module.get(EntriesService);
  });

  it('submit delegates to submitEntries with dto', async () => {
    const dto = {
      date: '2026-01-01',
      entries: [{ assetId: 'a1', currentValue: 1000 }],
    };
    const result = await controller.submit(boardId, req, dto);
    expect(service.submitEntries).toHaveBeenCalledWith(boardId, userId, dto);
    expect(result).toBe(mockDaily);
  });

  it('latest delegates to getLatestEntries', async () => {
    const result = await controller.latest(boardId, req);
    expect(service.getLatestEntries).toHaveBeenCalledWith(boardId, userId);
    expect(result).toEqual([mockEntry]);
  });

  it('forDate delegates to getEntriesForDate with date query', async () => {
    const result = await controller.forDate(boardId, req, '2026-01-01');
    expect(service.getEntriesForDate).toHaveBeenCalledWith(
      boardId,
      userId,
      '2026-01-01',
    );
    expect(result).toBe(mockDaily);
  });

  it('nav delegates to getNavHistory with all query params', async () => {
    const result = await controller.nav(
      boardId,
      req,
      '2026-01-01',
      '2026-12-31',
      'monthly',
    );
    expect(service.getNavHistory).toHaveBeenCalledWith(
      boardId,
      userId,
      '2026-01-01',
      '2026-12-31',
      'monthly',
    );
    expect(result).toEqual([mockNav]);
  });

  it('nav passes undefined when query params omitted', async () => {
    await controller.nav(boardId, req);
    expect(service.getNavHistory).toHaveBeenCalledWith(
      boardId,
      userId,
      undefined,
      undefined,
      undefined,
    );
  });

  it('upsertNav delegates to upsertManualNavSnapshot with dto', async () => {
    const dto = { date: '2026-01-01', totalValue: 1200, totalCapital: 1000 };
    const result = await controller.upsertNav(boardId, req, dto);
    expect(service.upsertManualNavSnapshot).toHaveBeenCalledWith(
      boardId,
      userId,
      dto,
    );
    expect(result).toBe(mockNav);
  });

  it('deleteNav delegates to deleteNavSnapshot', async () => {
    await controller.deleteNav(boardId, 'n1', req);
    expect(service.deleteNavSnapshot).toHaveBeenCalledWith(
      boardId,
      userId,
      'n1',
    );
  });
});
