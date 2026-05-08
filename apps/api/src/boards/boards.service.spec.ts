import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { Asset } from '../assets/entities/asset.entity';
import { AssetEntry } from '../entries/entities/asset-entry.entity';
import { UsersService } from '../users/users.service';

const userId = 'owner-1';
const otherId = 'other-1';
const boardId = 'board-1';

const mockBoard = {
  id: boardId,
  name: 'My Board',
  ownerId: userId,
  bankBalance: 0,
  cashBalance: 0,
  createdAt: new Date('2024-01-01'),
  members: [],
} as unknown as Board;

const mockUser = {
  id: userId,
  email: 'owner@example.com',
  name: 'Owner',
  passwordHash: '',
  createdAt: new Date(),
} as import('../auth/entities/user.entity').User;

function makeQueryBuilder(result: unknown[] = []) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    distinctOn: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
  } as unknown as SelectQueryBuilder<never>;
}

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepo: jest.Mocked<{
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  }>;
  let memberRepo: jest.Mocked<{
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  }>;
  let assetRepo: jest.Mocked<{ createQueryBuilder: jest.Mock }>;
  let entryRepo: jest.Mocked<{ createQueryBuilder: jest.Mock }>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    boardRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
    } as never;

    memberRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as never;

    assetRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
    } as never;

    entryRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
    } as never;

    usersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
      searchByEmail: jest.fn(),
      create: jest.fn(),
    } as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: getRepositoryToken(Board), useValue: boardRepo },
        { provide: getRepositoryToken(BoardMember), useValue: memberRepo },
        { provide: getRepositoryToken(Asset), useValue: assetRepo },
        { provide: getRepositoryToken(AssetEntry), useValue: entryRepo },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(BoardsService);
  });

  describe('getUserRole', () => {
    it('returns null for missing board', async () => {
      boardRepo.findOneBy.mockResolvedValue(null);
      expect(await service.getUserRole(boardId, userId)).toBeNull();
    });

    it('returns OWNER for board owner', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      expect(await service.getUserRole(boardId, userId)).toBe('OWNER');
    });

    it('returns EDITOR for board member with EDITOR role', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      memberRepo.findOneBy.mockResolvedValue({ role: 'EDITOR' });
      expect(await service.getUserRole(boardId, otherId)).toBe('EDITOR');
    });

    it('returns null for non-member', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      memberRepo.findOneBy.mockResolvedValue(null);
      expect(await service.getUserRole(boardId, otherId)).toBeNull();
    });
  });

  describe('createBoard', () => {
    it('creates board and returns DTO', async () => {
      boardRepo.create.mockReturnValue(mockBoard);
      boardRepo.save.mockResolvedValue(mockBoard);

      const result = await service.createBoard(userId, { name: 'My Board' });

      expect(boardRepo.create).toHaveBeenCalledWith({
        name: 'My Board',
        ownerId: userId,
      });
      expect(result).toMatchObject({
        id: boardId,
        name: 'My Board',
        ownerId: userId,
        role: 'OWNER',
        members: [],
      });
    });
  });

  describe('getBoardById', () => {
    it('throws NotFoundException when board missing', async () => {
      boardRepo.findOne.mockResolvedValue(null);
      await expect(service.getBoardById(boardId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-member', async () => {
      boardRepo.findOne.mockResolvedValue({ ...mockBoard, members: [] });
      boardRepo.findOneBy.mockResolvedValue({ ...mockBoard, ownerId: userId });
      memberRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getBoardById(boardId, otherId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns board DTO for owner', async () => {
      boardRepo.findOne.mockResolvedValue({ ...mockBoard, members: [] });
      boardRepo.findOneBy.mockResolvedValue(mockBoard);

      const result = await service.getBoardById(boardId, userId);

      expect(result.id).toBe(boardId);
      expect(result.role).toBe('OWNER');
    });
  });

  describe('updateBoard', () => {
    it('throws ForbiddenException for VIEWER', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      memberRepo.findOneBy.mockResolvedValue({ role: 'VIEWER' });

      await expect(
        service.updateBoard(boardId, otherId, { name: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteBoard', () => {
    it('deletes board for owner', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);

      await service.deleteBoard(boardId, userId);

      expect(boardRepo.delete).toHaveBeenCalledWith(boardId);
    });

    it('throws NotFoundException for missing board', async () => {
      boardRepo.findOneBy.mockResolvedValue(null);
      await expect(service.deleteBoard(boardId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-owner', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      await expect(service.deleteBoard(boardId, otherId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addMember', () => {
    it('throws NotFoundException when target user not found', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.addMember(boardId, userId, {
          email: 'ghost@example.com',
          role: 'EDITOR',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates new membership when none exists', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      const targetUser = {
        ...mockUser,
        id: 'target-1',
        email: 'target@example.com',
      } as import('../auth/entities/user.entity').User;
      usersService.findByEmail.mockResolvedValue(targetUser);
      memberRepo.findOneBy.mockResolvedValue(null);
      memberRepo.create.mockReturnValue({ boardId, userId: targetUser.id });
      memberRepo.save.mockResolvedValue({});

      const result = await service.addMember(boardId, userId, {
        email: 'target@example.com',
        role: 'EDITOR',
      });

      expect(memberRepo.save).toHaveBeenCalled();
      expect(result.role).toBe('EDITOR');
    });

    it('updates existing membership role', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);
      const targetUser = {
        ...mockUser,
        id: 'target-1',
        email: 'target@example.com',
      } as import('../auth/entities/user.entity').User;
      usersService.findByEmail.mockResolvedValue(targetUser);
      memberRepo.findOneBy.mockResolvedValue({
        id: 'member-1',
        role: 'VIEWER',
      });

      const result = await service.addMember(boardId, userId, {
        email: 'target@example.com',
        role: 'EDITOR',
      });

      expect(memberRepo.update).toHaveBeenCalledWith('member-1', {
        role: 'EDITOR',
      });
      expect(result.role).toBe('EDITOR');
    });
  });

  describe('removeMember', () => {
    it('removes member for board owner', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);

      await service.removeMember(boardId, userId, otherId);

      expect(memberRepo.delete).toHaveBeenCalledWith({
        boardId,
        userId: otherId,
      });
    });

    it('throws ForbiddenException for non-owner', async () => {
      boardRepo.findOneBy.mockResolvedValue(mockBoard);

      await expect(
        service.removeMember(boardId, otherId, 'victim'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
