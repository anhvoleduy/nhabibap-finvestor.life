import axios from 'axios';
import { authHeader, registerAndLogin } from '../support/helpers';

describe('Entries & NAV', () => {
  let token: string;
  let boardId: string;
  let assetId: string;

  beforeAll(async () => {
    ({ token } = await registerAndLogin());

    const board = await axios.post(
      '/boards',
      { name: 'Entry Board' },
      { headers: authHeader(token) },
    );
    boardId = board.data.id;

    const cat = await axios.post(
      `/boards/${boardId}/categories`,
      { type: 'ETF' },
      { headers: authHeader(token) },
    );

    const asset = await axios.post(
      `/boards/${boardId}/categories/${cat.data.id}/assets`,
      { name: 'VN30 ETF', capital: 30000000 },
      { headers: authHeader(token) },
    );
    assetId = asset.data.id;
  });

  describe('GET /boards/:boardId/entries/latest', () => {
    it('returns empty array for board with no entries', async () => {
      const res = await axios.get(`/boards/${boardId}/entries/latest`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });
  });

  describe('POST /boards/:boardId/entries', () => {
    it('submits daily entries', async () => {
      const res = await axios.post(
        `/boards/${boardId}/entries`,
        {
          date: '2025-05-01',
          entries: [{ assetId, currentValue: 32000000 }],
        },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.date).toBe('2025-05-01');
      expect(res.data.entries).toHaveLength(1);
      expect(res.data.entries[0].assetId).toBe(assetId);
      expect(res.data.entries[0].currentValue).toBe(32000000);
    });

    it('rejects invalid date format with 400', async () => {
      const res = await axios.post(
        `/boards/${boardId}/entries`,
        { date: 'not-a-date', entries: [{ assetId, currentValue: 100 }] },
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });

    it('rejects negative currentValue with 400', async () => {
      const res = await axios.post(
        `/boards/${boardId}/entries`,
        { date: '2025-05-02', entries: [{ assetId, currentValue: -1 }] },
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('GET /boards/:boardId/entries/latest (after submit)', () => {
    it('returns latest entry per asset', async () => {
      const res = await axios.get(`/boards/${boardId}/entries/latest`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].assetId).toBe(assetId);
    });
  });

  describe('GET /boards/:boardId/entries?date=', () => {
    it('returns entries for specific date', async () => {
      const res = await axios.get(
        `/boards/${boardId}/entries?date=2025-05-01`,
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.date).toBe('2025-05-01');
      expect(res.data.entries.length).toBeGreaterThan(0);
    });

    it('returns empty entries for date with no data', async () => {
      const res = await axios.get(
        `/boards/${boardId}/entries?date=2000-01-01`,
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.entries).toEqual([]);
    });
  });

  describe('NAV', () => {
    let snapshotId: string;

    it('GET /boards/:boardId/nav returns history', async () => {
      const res = await axios.get(`/boards/${boardId}/nav`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('POST /boards/:boardId/nav upserts NAV snapshot', async () => {
      const res = await axios.post(
        `/boards/${boardId}/nav`,
        { date: '2025-05-01', totalValue: 32000000, totalCapital: 30000000 },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.totalValue).toBe(32000000);
      expect(res.data.snapshotDate).toBe('2025-05-01');
      snapshotId = res.data.id;
    });

    it('GET /boards/:boardId/nav with date range filter', async () => {
      const res = await axios.get(
        `/boards/${boardId}/nav?from=2025-01-01&to=2025-12-31`,
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('DELETE /boards/:boardId/nav/:snapshotId removes snapshot', async () => {
      const res = await axios.delete(`/boards/${boardId}/nav/${snapshotId}`, {
        headers: authHeader(token),
        validateStatus: () => true,
      });

      expect(res.status).toBe(204);
    });
  });
});
