import axios from 'axios';
import { authHeader, registerAndLogin } from '../support/helpers';

describe('Assets', () => {
  let token: string;
  let boardId: string;

  beforeAll(async () => {
    ({ token } = await registerAndLogin());
    const board = await axios.post(
      '/boards',
      { name: 'Asset Board' },
      { headers: authHeader(token) },
    );
    boardId = board.data.id;
  });

  describe('Categories', () => {
    it('GET /boards/:boardId/categories returns empty list', async () => {
      const res = await axios.get(`/boards/${boardId}/categories`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });

    it('POST /boards/:boardId/categories creates category', async () => {
      const res = await axios.post(
        `/boards/${boardId}/categories`,
        { type: 'GOLD' },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.type).toBe('GOLD');
      expect(res.data.id).toBeTruthy();
      expect(res.data.assets).toEqual([]);
    });

    it('rejects duplicate category type with 409', async () => {
      const res = await axios.post(
        `/boards/${boardId}/categories`,
        { type: 'GOLD' },
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(409);
    });

    it('rejects invalid category type with 400', async () => {
      const res = await axios.post(
        `/boards/${boardId}/categories`,
        { type: 'INVALID' },
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('Assets CRUD', () => {
    let catId: string;
    let assetId: string;

    beforeAll(async () => {
      const cat = await axios.post(
        `/boards/${boardId}/categories`,
        { type: 'CRYPTO' },
        { headers: authHeader(token) },
      );
      catId = cat.data.id;
    });

    it('POST .../assets creates asset', async () => {
      const res = await axios.post(
        `/boards/${boardId}/categories/${catId}/assets`,
        { name: 'BTC', capital: 10000000 },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.name).toBe('BTC');
      expect(res.data.capital).toBe(10000000);
      assetId = res.data.id;
    });

    it('GET /boards/:boardId/categories lists asset within category', async () => {
      const res = await axios.get(`/boards/${boardId}/categories`, {
        headers: authHeader(token),
      });

      const cat = res.data.find((c: { id: string }) => c.id === catId);
      expect(cat).toBeDefined();
      expect(cat.assets.some((a: { id: string }) => a.id === assetId)).toBe(
        true,
      );
    });

    it('PATCH .../assets/:assetId updates asset', async () => {
      const res = await axios.patch(
        `/boards/${boardId}/categories/${catId}/assets/${assetId}`,
        { name: 'Bitcoin', capital: 20000000 },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Bitcoin');
      expect(res.data.capital).toBe(20000000);
    });

    describe('Crypto buys', () => {
      let buyId: string;

      it('POST .../crypto-buys creates buy', async () => {
        const res = await axios.post(
          `/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys`,
          { buyDate: '2025-01-15', amountVnd: 5000000 },
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(201);
        expect(res.data.amountVnd).toBe(5000000);
        expect(res.data.assetId).toBe(assetId);
        buyId = res.data.id;
      });

      it('GET .../crypto-buys lists buys', async () => {
        const res = await axios.get(
          `/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys`,
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(200);
        expect(res.data.some((b: { id: string }) => b.id === buyId)).toBe(true);
      });

      it('PATCH .../crypto-buys/:buyId updates buy', async () => {
        const res = await axios.patch(
          `/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys/${buyId}`,
          { amountVnd: 7000000 },
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(200);
        expect(res.data.amountVnd).toBe(7000000);
      });

      it('DELETE .../crypto-buys/:buyId removes buy', async () => {
        const res = await axios.delete(
          `/boards/${boardId}/categories/${catId}/assets/${assetId}/crypto-buys/${buyId}`,
          { headers: authHeader(token), validateStatus: () => true },
        );

        expect(res.status).toBe(204);
      });
    });

    describe('Gold buys', () => {
      let goldCatId: string;
      let goldAssetId: string;
      let buyId: string;

      beforeAll(async () => {
        const cat = await axios.post(
          `/boards/${boardId}/categories`,
          { type: 'SAVINGS' },
          { headers: authHeader(token) },
        );
        goldCatId = cat.data.id;

        const asset = await axios.post(
          `/boards/${boardId}/categories/${goldCatId}/assets`,
          { name: 'SJC Gold', capital: 50000000 },
          { headers: authHeader(token) },
        );
        goldAssetId = asset.data.id;
      });

      it('POST .../gold-buys creates buy', async () => {
        const res = await axios.post(
          `/boards/${boardId}/categories/${goldCatId}/assets/${goldAssetId}/gold-buys`,
          { buyDate: '2025-03-01', chiAmount: 2, amountVnd: 18000000 },
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(201);
        expect(res.data.chiAmount).toBe(2);
        expect(res.data.amountVnd).toBe(18000000);
        buyId = res.data.id;
      });

      it('GET .../gold-buys lists buys', async () => {
        const res = await axios.get(
          `/boards/${boardId}/categories/${goldCatId}/assets/${goldAssetId}/gold-buys`,
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(200);
        expect(res.data.some((b: { id: string }) => b.id === buyId)).toBe(true);
      });

      it('PATCH .../gold-buys/:buyId updates buy', async () => {
        const res = await axios.patch(
          `/boards/${boardId}/categories/${goldCatId}/assets/${goldAssetId}/gold-buys/${buyId}`,
          { amountVnd: 19000000 },
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(200);
        expect(res.data.amountVnd).toBe(19000000);
      });

      it('DELETE .../gold-buys/:buyId removes buy', async () => {
        const res = await axios.delete(
          `/boards/${boardId}/categories/${goldCatId}/assets/${goldAssetId}/gold-buys/${buyId}`,
          { headers: authHeader(token), validateStatus: () => true },
        );

        expect(res.status).toBe(204);
      });
    });

    it('DELETE .../assets/:assetId removes asset', async () => {
      const res = await axios.delete(
        `/boards/${boardId}/categories/${catId}/assets/${assetId}`,
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(204);
    });
  });

  describe('Cash assets (no capital / profit)', () => {
    let cashCatId: string;
    let cashAssetId: string;

    beforeAll(async () => {
      const cat = await axios.post(
        `/boards/${boardId}/categories`,
        { type: 'CASH' },
        { headers: authHeader(token) },
      );
      cashCatId = cat.data.id;
    });

    it('creates cash asset without capital', async () => {
      const res = await axios.post(
        `/boards/${boardId}/categories/${cashCatId}/assets`,
        { name: 'Tiền mặt' },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.name).toBe('Tiền mặt');
      expect(res.data.capital).toBeNull();
      expect(res.data.profit).toBeNull();
      expect(res.data.profitPct).toBeNull();
      cashAssetId = res.data.id;
    });

    it('ignores capital when creating cash asset', async () => {
      const res = await axios.post(
        `/boards/${boardId}/categories/${cashCatId}/assets`,
        { name: 'Chờ mua', capital: 999999 },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.capital).toBeNull();
      expect(res.data.profit).toBeNull();
    });

    it('category returns null totalCapital and profitPct for CASH', async () => {
      const res = await axios.get(`/boards/${boardId}/categories`, {
        headers: authHeader(token),
      });

      const cat = res.data.find((c: { id: string }) => c.id === cashCatId);
      expect(cat).toBeDefined();
      expect(cat.totalCapital).toBeNull();
      expect(cat.profitPct).toBeNull();
    });

    it('PATCH cash asset updates name only', async () => {
      const res = await axios.patch(
        `/boards/${boardId}/categories/${cashCatId}/assets/${cashAssetId}`,
        { name: 'Tiền mặt VND' },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Tiền mặt VND');
      expect(res.data.capital).toBeNull();
    });
  });
});
