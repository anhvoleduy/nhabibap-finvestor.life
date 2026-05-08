import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BoardMember, MemberRole } from './entities/board-member.entity';
import {
  AddMemberDto,
  BoardDto,
  BoardMemberDto,
  BoardSummaryDto,
  CreateBoardDto,
  UpdateBoardDto,
} from '@nhabibap-myportfolio/shared-types';
import { UsersService } from '../users/users.service';
import { AssetEntry } from '../entries/entities/asset-entry.entity';
import { Asset } from '../assets/entities/asset.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boardRepo: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly memberRepo: Repository<BoardMember>,
    @InjectRepository(Asset) private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetEntry)
    private readonly entryRepo: Repository<AssetEntry>,
    private readonly users: UsersService,
  ) {}

  async getUserBoards(userId: string): Promise<BoardSummaryDto[]> {
    const owned = await this.boardRepo.find({ where: { ownerId: userId } });
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: ['board'],
    });
    const sharedBoards = memberships.map((m) => ({
      board: m.board,
      role: m.role as MemberRole,
    }));

    const all = [
      ...owned.map((b) => ({ board: b, role: 'OWNER' as const })),
      ...sharedBoards,
    ];

    return Promise.all(
      all.map(async ({ board, role }) => {
        const { totalCapital, totalValue } = await this.getBoardTotals(
          board.id,
        );
        const ownerUser = await this.users.findById(board.ownerId);
        return {
          id: board.id,
          name: board.name,
          ownerId: board.ownerId,
          ownerName: ownerUser?.name ?? '',
          role,
          totalCapital,
          totalValue,
          profitPct:
            totalCapital > 0
              ? ((totalValue - totalCapital) / totalCapital) * 100
              : 0,
          createdAt: board.createdAt.toISOString(),
        } satisfies BoardSummaryDto;
      }),
    );
  }

  async getBoardById(boardId: string, userId: string): Promise<BoardDto> {
    const board = await this.boardRepo.findOne({
      where: { id: boardId },
      relations: ['members', 'members.user'],
    });
    if (!board) throw new NotFoundException('Board not found');

    const role = await this.getUserRole(boardId, userId);
    if (!role) throw new ForbiddenException();

    const ownerUser = await this.users.findById(board.ownerId);
    const members: BoardMemberDto[] = board.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    return {
      id: board.id,
      name: board.name,
      ownerId: board.ownerId,
      ownerName: ownerUser?.name ?? '',
      createdAt: board.createdAt.toISOString(),
      members,
      role,
      bankBalance: Number(board.bankBalance),
      cashBalance: Number(board.cashBalance),
    };
  }

  async createBoard(userId: string, dto: CreateBoardDto): Promise<BoardDto> {
    const board = this.boardRepo.create({ name: dto.name, ownerId: userId });
    const saved = await this.boardRepo.save(board);
    const user = await this.users.findById(userId);
    return {
      id: saved.id,
      name: saved.name,
      ownerId: saved.ownerId,
      ownerName: user?.name ?? '',
      createdAt: saved.createdAt.toISOString(),
      members: [],
      role: 'OWNER',
      bankBalance: 0,
      cashBalance: 0,
    };
  }

  async updateBoard(
    boardId: string,
    userId: string,
    dto: UpdateBoardDto,
  ): Promise<BoardDto> {
    const role = await this.getUserRole(boardId, userId);
    if (!role || role === 'VIEWER') throw new ForbiddenException();
    const patch: Partial<Board> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.bankBalance !== undefined) patch.bankBalance = dto.bankBalance;
    if (dto.cashBalance !== undefined) patch.cashBalance = dto.cashBalance;
    if (Object.keys(patch).length) await this.boardRepo.update(boardId, patch);
    return this.getBoardById(boardId, userId);
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.boardRepo.findOneBy({ id: boardId });
    if (!board) throw new NotFoundException();
    if (board.ownerId !== userId) throw new ForbiddenException();
    await this.boardRepo.delete(boardId);
  }

  async addMember(
    boardId: string,
    ownerId: string,
    dto: AddMemberDto,
  ): Promise<BoardMemberDto> {
    await this.assertOwner(boardId, ownerId);
    const targetUser = await this.users.findByEmail(dto.email);
    if (!targetUser) throw new NotFoundException('User not found');
    const existing = await this.memberRepo.findOneBy({
      boardId,
      userId: targetUser.id,
    });
    if (existing) {
      await this.memberRepo.update(existing.id, { role: dto.role });
      return {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: dto.role,
      };
    }
    const member = this.memberRepo.create({
      boardId,
      userId: targetUser.id,
      role: dto.role,
    });
    await this.memberRepo.save(member);
    return {
      userId: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: dto.role,
    };
  }

  async removeMember(
    boardId: string,
    ownerId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.assertOwner(boardId, ownerId);
    await this.memberRepo.delete({ boardId, userId: targetUserId });
  }

  async getUserRole(
    boardId: string,
    userId: string,
  ): Promise<'OWNER' | 'EDITOR' | 'VIEWER' | null> {
    const board = await this.boardRepo.findOneBy({ id: boardId });
    if (!board) return null;
    if (board.ownerId === userId) return 'OWNER';
    const member = await this.memberRepo.findOneBy({ boardId, userId });
    return member ? (member.role as 'EDITOR' | 'VIEWER') : null;
  }

  private async assertOwner(boardId: string, userId: string): Promise<void> {
    const board = await this.boardRepo.findOneBy({ id: boardId });
    if (!board) throw new NotFoundException();
    if (board.ownerId !== userId) throw new ForbiddenException();
  }

  private async getBoardTotals(
    boardId: string,
  ): Promise<{ totalCapital: number; totalValue: number }> {
    const assets = await this.assetRepo
      .createQueryBuilder('a')
      .innerJoin('a.category', 'c')
      .where('c.boardId = :boardId', { boardId })
      .getMany();

    const totalCapital = assets.reduce((sum, a) => sum + Number(a.capital), 0);

    if (assets.length === 0) return { totalCapital: 0, totalValue: 0 };

    const assetIds = assets.map((a) => a.id);
    const latestEntries = await this.entryRepo
      .createQueryBuilder('e')
      .distinctOn(['e.assetId'])
      .where('e.assetId IN (:...ids)', { ids: assetIds })
      .orderBy('e.assetId')
      .addOrderBy('e.entryDate', 'DESC')
      .getMany();

    const totalValue = latestEntries.reduce(
      (sum, e) => sum + Number(e.currentValue),
      0,
    );
    return { totalCapital, totalValue };
  }
}
