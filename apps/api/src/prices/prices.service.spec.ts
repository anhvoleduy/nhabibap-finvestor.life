import axios from 'axios';
import { PricesService } from './prices.service';

jest.mock('axios');
const mockedGet = axios.get as jest.Mock;

const CRYPTO = {
  bitcoin: { usd: 59214, usd_24h_change: -0.92 },
  ethereum: { usd: 1581.31, usd_24h_change: 0.66 },
  solana: { usd: 73.41, usd_24h_change: 0.86 },
  binancecoin: { usd: 540, usd_24h_change: 1.2 },
};
const GOLD = {
  data: [{ masp: 'SJC', tensp: 'Vàng miếng SJC', giaban: 14700 }],
};
const FX = { result: 'success', rates: { VND: 26201.38 } };

/** Route mocked axios.get by URL so each source returns its own payload. */
function routeByUrl(url: string) {
  if (url.includes('coingecko')) return Promise.resolve({ data: CRYPTO });
  if (url.includes('pnj.io')) return Promise.resolve({ data: GOLD });
  if (url.includes('er-api')) return Promise.resolve({ data: FX });
  return Promise.reject(new Error(`unexpected url ${url}`));
}

describe('PricesService', () => {
  let service: PricesService;

  beforeEach(() => {
    service = new PricesService();
    mockedGet.mockReset();
  });

  describe('getQuotes', () => {
    it('merges crypto, gold and FX quotes', async () => {
      mockedGet.mockImplementation((url: string) => routeByUrl(url));
      const items = await service.getQuotes();

      const btc = items.find((i) => i.symbol === 'BTC');
      expect(btc).toMatchObject({
        price: 59214,
        unit: 'USD',
        changePct: -0.92,
      });

      const gold = items.find((i) => i.symbol === 'GOLD-SJC');
      // giaban is thousand VND/chỉ → multiplied to VND.
      expect(gold).toMatchObject({
        price: 14700000,
        unit: 'VND/chỉ',
        source: 'PNJ',
      });

      const fx = items.find((i) => i.symbol === 'USD/VND');
      expect(fx).toMatchObject({ price: 26201.38, unit: 'VND' });
    });

    it('degrades gracefully: a dead source is skipped, others still serve', async () => {
      mockedGet.mockImplementation((url: string) => {
        if (url.includes('pnj.io')) return Promise.reject(new Error('down'));
        return routeByUrl(url);
      });
      const items = await service.getQuotes();

      expect(items.find((i) => i.symbol === 'GOLD-SJC')).toBeUndefined();
      expect(items.find((i) => i.symbol === 'BTC')).toBeDefined();
      expect(items.find((i) => i.symbol === 'USD/VND')).toBeDefined();
    });

    it('caches within the TTL (no second fetch burst)', async () => {
      mockedGet.mockImplementation((url: string) => routeByUrl(url));
      await service.getQuotes();
      const callsAfterFirst = mockedGet.mock.calls.length;
      await service.getQuotes();
      expect(mockedGet.mock.calls.length).toBe(callsAfterFirst);
    });
  });
});
