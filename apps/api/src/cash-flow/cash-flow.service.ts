import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashFlowEntry } from './entities/cash-flow-entry.entity';
import { BoardsService } from '../boards/boards.service';
import {
  CashFlowEntryDto,
  CreateCashFlowDto,
  FlowType,
  UpdateCashFlowDto,
} from '@nhabibap-myportfolio/shared-types';

@Injectable()
export class CashFlowService {
  constructor(
    @InjectRepository(CashFlowEntry)
    private readonly repo: Repository<CashFlowEntry>,
    private readonly boardsService: BoardsService,
  ) {}

  async list(boardId: string, userId: string): Promise<CashFlowEntryDto[]> {
    await this.assertMember(boardId, userId);
    const entries = await this.repo.find({
      where: { boardId },
      order: { entryDate: 'DESC' },
    });
    return entries.map(this.toDto);
  }

  async create(
    boardId: string,
    userId: string,
    dto: CreateCashFlowDto,
  ): Promise<CashFlowEntryDto> {
    await this.assertMember(boardId, userId);
    const entry = this.repo.create({ boardId, ...dto });
    return this.toDto(await this.repo.save(entry));
  }

  async update(
    boardId: string,
    entryId: string,
    userId: string,
    dto: UpdateCashFlowDto,
  ): Promise<CashFlowEntryDto> {
    await this.assertMember(boardId, userId);
    const entry = await this.repo.findOneBy({ id: entryId, boardId });
    if (!entry) throw new NotFoundException();
    Object.assign(entry, dto);
    return this.toDto(await this.repo.save(entry));
  }

  async remove(
    boardId: string,
    entryId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMember(boardId, userId);
    const entry = await this.repo.findOneBy({ id: entryId, boardId });
    if (!entry) throw new NotFoundException();
    await this.repo.delete(entryId);
  }

  private toDto(e: CashFlowEntry): CashFlowEntryDto {
    return {
      id: e.id,
      boardId: e.boardId,
      entryDate: e.entryDate,
      label: e.label,
      amount: Number(e.amount),
      flowType: e.flowType as FlowType,
    };
  }

  private async assertMember(boardId: string, userId: string): Promise<void> {
    const role = await this.boardsService.getUserRole(boardId, userId);
    if (!role) throw new ForbiddenException();
  }
}
