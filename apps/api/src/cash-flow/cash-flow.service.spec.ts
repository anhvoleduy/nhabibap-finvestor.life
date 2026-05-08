import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';
import { FlowType } from '@nhabibap-myportfolio/shared-types';
import { CashFlowEntry } from './entities/cash-flow-entry.entity';
import { BoardsService } from '../boards/boards.service';

const boardId = 'board-1';
const userId = 'user-1';
const entryId = 'entry-1';

const mockEntry = {
  id: entryId,
  boardId,
  entryDate: '2024-01-15',
  label: 'Salary',
  amount: 10_000_000,
  flowType: FlowType.INCOME,
} as unknown as CashFlowEntry;

describe('CashFlowService', () => {
  let service: CashFlowService;
  let repo: jest.Mocked<{
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  }>;
  let boardsService: jest.Mocked<Pick<BoardsService, 'getUserRole'>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as never;

    boardsService = {
      getUserRole: jest.fn().mockResolvedValue('OWNER'),
    } as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowService,
        { provide: getRepositoryToken(CashFlowEntry), useValue: repo },
        { provide: BoardsService, useValue: boardsService },
      ],
    }).compile();

    service = module.get(CashFlowService);
  });

  describe('list', () => {
    it('throws ForbiddenException for non-member', async () => {
      boardsService.getUserRole.mockResolvedValue(null);
      await expect(service.list(boardId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns mapped DTOs for member', async () => {
      repo.find.mockResolvedValue([mockEntry]);

      const result = await service.list(boardId, userId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { boardId },
        order: { entryDate: 'DESC' },
      });
      expect(result).toEqual([
        {
          id: entryId,
          boardId,
          entryDate: '2024-01-15',
          label: 'Salary',
          amount: 10_000_000,
          flowType: FlowType.INCOME,
        },
      ]);
    });
  });

  describe('create', () => {
    it('creates and returns entry DTO', async () => {
      repo.create.mockReturnValue(mockEntry);
      repo.save.mockResolvedValue(mockEntry);

      const dto = {
        entryDate: '2024-01-15',
        label: 'Salary',
        amount: 10_000_000,
        flowType: FlowType.INCOME,
      };
      const result = await service.create(boardId, userId, dto);

      expect(repo.create).toHaveBeenCalledWith({ boardId, ...dto });
      expect(result.id).toBe(entryId);
      expect(result.amount).toBe(10_000_000);
    });

    it('throws ForbiddenException for non-member', async () => {
      boardsService.getUserRole.mockResolvedValue(null);

      await expect(
        service.create(boardId, userId, {
          entryDate: '2024-01-15',
          label: 'X',
          amount: 1,
          flowType: FlowType.INCOME,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates and returns entry DTO', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockEntry });
      repo.save.mockResolvedValue({ ...mockEntry, label: 'Updated' });

      const result = await service.update(boardId, entryId, userId, {
        label: 'Updated',
      });

      expect(result.label).toBe('Updated');
    });

    it('throws NotFoundException when entry missing', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(boardId, entryId, userId, { label: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes entry', async () => {
      repo.findOneBy.mockResolvedValue(mockEntry);

      await service.remove(boardId, entryId, userId);

      expect(repo.delete).toHaveBeenCalledWith(entryId);
    });

    it('throws NotFoundException when entry missing', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove(boardId, entryId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
