import { Test, TestingModule } from '@nestjs/testing';
import { FlowType } from '@nhabibap-myportfolio/shared-types';
import { CashFlowController } from './cash-flow.controller';
import { CashFlowService } from './cash-flow.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';

const userId = 'user-1';
const boardId = 'b1';
const req = { user: { sub: userId, email: 't@e.com' } } as AuthenticatedRequest;

const mockEntry = {
  id: 'cf1',
  boardId,
  entryDate: '2026-01-01',
  label: 'salary',
  amount: 1000,
  flowType: FlowType.INCOME,
};

describe('CashFlowController', () => {
  let controller: CashFlowController;
  let service: jest.Mocked<CashFlowService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashFlowController],
      providers: [
        {
          provide: CashFlowService,
          useValue: {
            list: jest.fn().mockResolvedValue([mockEntry]),
            create: jest.fn().mockResolvedValue(mockEntry),
            update: jest.fn().mockResolvedValue(mockEntry),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CashFlowController);
    service = module.get(CashFlowService);
  });

  it('list delegates to service.list', async () => {
    const result = await controller.list(boardId, req);
    expect(service.list).toHaveBeenCalledWith(boardId, userId);
    expect(result).toEqual([mockEntry]);
  });

  it('create delegates to service.create with dto', async () => {
    const dto = {
      entryDate: '2026-01-01',
      label: 'salary',
      amount: 1000,
      flowType: FlowType.INCOME,
    };
    const result = await controller.create(boardId, req, dto);
    expect(service.create).toHaveBeenCalledWith(boardId, userId, dto);
    expect(result).toBe(mockEntry);
  });

  it('update delegates to service.update with entryId + dto', async () => {
    const dto = { amount: 2000 };
    const result = await controller.update(boardId, 'cf1', req, dto);
    expect(service.update).toHaveBeenCalledWith(boardId, 'cf1', userId, dto);
    expect(result).toBe(mockEntry);
  });

  it('remove delegates to service.remove', async () => {
    await controller.remove(boardId, 'cf1', req);
    expect(service.remove).toHaveBeenCalledWith(boardId, 'cf1', userId);
  });
});
