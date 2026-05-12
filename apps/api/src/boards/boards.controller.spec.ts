import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';

const userId = 'user-1';
const req = { user: { sub: userId, email: 't@e.com' } } as AuthenticatedRequest;

const mockBoardSummary = { id: 'b1', name: 'Board 1', role: 'owner' };
const mockBoard = {
  id: 'b1',
  name: 'Board 1',
  ownerId: userId,
  members: [],
  createdAt: new Date(),
};

describe('BoardsController', () => {
  let controller: BoardsController;
  let service: jest.Mocked<BoardsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [
        {
          provide: BoardsService,
          useValue: {
            getUserBoards: jest.fn().mockResolvedValue([mockBoardSummary]),
            createBoard: jest.fn().mockResolvedValue(mockBoard),
            getBoardById: jest.fn().mockResolvedValue(mockBoard),
            updateBoard: jest.fn().mockResolvedValue(mockBoard),
            deleteBoard: jest.fn().mockResolvedValue(undefined),
            addMember: jest.fn().mockResolvedValue(mockBoard),
            removeMember: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(BoardsController);
    service = module.get(BoardsService);
  });

  it('list delegates to getUserBoards', async () => {
    const result = await controller.list(req);
    expect(service.getUserBoards).toHaveBeenCalledWith(userId);
    expect(result).toEqual([mockBoardSummary]);
  });

  it('create delegates to createBoard with dto', async () => {
    const dto = { name: 'New Board' };
    const result = await controller.create(req, dto);
    expect(service.createBoard).toHaveBeenCalledWith(userId, dto);
    expect(result).toBe(mockBoard);
  });

  it('get delegates to getBoardById', async () => {
    const result = await controller.get('b1', req);
    expect(service.getBoardById).toHaveBeenCalledWith('b1', userId);
    expect(result).toBe(mockBoard);
  });

  it('update delegates to updateBoard with dto', async () => {
    const dto = { name: 'Renamed' };
    const result = await controller.update('b1', req, dto);
    expect(service.updateBoard).toHaveBeenCalledWith('b1', userId, dto);
    expect(result).toBe(mockBoard);
  });

  it('delete delegates to deleteBoard', async () => {
    await controller.delete('b1', req);
    expect(service.deleteBoard).toHaveBeenCalledWith('b1', userId);
  });

  it('addMember delegates to addMember with dto', async () => {
    const dto = { email: 'u2@e.com', role: 'EDITOR' as const };
    const result = await controller.addMember('b1', req, dto);
    expect(service.addMember).toHaveBeenCalledWith('b1', userId, dto);
    expect(result).toBe(mockBoard);
  });

  it('removeMember delegates to removeMember', async () => {
    await controller.removeMember('b1', 'user-2', req);
    expect(service.removeMember).toHaveBeenCalledWith('b1', userId, 'user-2');
  });
});
