import axios from 'axios';
import { authHeader, registerAndLogin } from '../support/helpers';

describe('Cash Flow', () => {
  let token: string;
  let boardId: string;

  beforeAll(async () => {
    ({ token } = await registerAndLogin());
    const board = await axios.post(
      '/boards',
      { name: 'Cash Flow Board' },
      { headers: authHeader(token) },
    );
    boardId = board.data.id;
  });

  describe('GET /boards/:boardId/cash-flow', () => {
    it('returns empty list for new board', async () => {
      const res = await axios.get(`/boards/${boardId}/cash-flow`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });

    it('requires auth', async () => {
      const res = await axios.get(`/boards/${boardId}/cash-flow`, {
        validateStatus: () => true,
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Cash flow CRUD lifecycle', () => {
    let entryId: string;

    it('POST creates income entry', async () => {
      const res = await axios.post(
        `/boards/${boardId}/cash-flow`,
        {
          entryDate: '2025-04-01',
          label: 'Monthly salary',
          amount: 15000000,
          flowType: 'INCOME',
        },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.label).toBe('Monthly salary');
      expect(res.data.amount).toBe(15000000);
      expect(res.data.flowType).toBe('INCOME');
      expect(res.data.boardId).toBe(boardId);
      entryId = res.data.id;
    });

    it('POST creates expense entry', async () => {
      const res = await axios.post(
        `/boards/${boardId}/cash-flow`,
        {
          entryDate: '2025-04-05',
          label: 'Rent',
          amount: 5000000,
          flowType: 'EXPENSE',
        },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.flowType).toBe('EXPENSE');
    });

    it('GET lists created entries', async () => {
      const res = await axios.get(`/boards/${boardId}/cash-flow`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThanOrEqual(2);
      expect(res.data.some((e: { id: string }) => e.id === entryId)).toBe(true);
    });

    it('POST rejects invalid flowType with 400', async () => {
      const res = await axios.post(
        `/boards/${boardId}/cash-flow`,
        {
          entryDate: '2025-04-01',
          label: 'Bad',
          amount: 100,
          flowType: 'INVALID',
        },
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });

    it('PATCH updates entry label and amount', async () => {
      const res = await axios.patch(
        `/boards/${boardId}/cash-flow/${entryId}`,
        { label: 'Bonus salary', amount: 20000000 },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.label).toBe('Bonus salary');
      expect(res.data.amount).toBe(20000000);
    });

    it('DELETE removes entry', async () => {
      const res = await axios.delete(
        `/boards/${boardId}/cash-flow/${entryId}`,
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(204);
    });

    it('GET no longer shows deleted entry', async () => {
      const res = await axios.get(`/boards/${boardId}/cash-flow`, {
        headers: authHeader(token),
      });

      expect(res.data.some((e: { id: string }) => e.id === entryId)).toBe(
        false,
      );
    });
  });
});
