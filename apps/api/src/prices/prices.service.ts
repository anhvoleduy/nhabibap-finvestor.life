import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PriceQuoteDto } from '@nhabibap-myportfolio/shared-types';

interface CacheEntry {
  items: PriceQuoteDto[];
  expires: number;
}

const CACHE_TTL_MS = 60 * 1000;
const SOURCE_TIMEOUT_MS = 8000;

/** Crypto coins surfaced in the ticker. id = CoinGecko id, symbol = display. */
const CRYPTO_COINS: { id: string; symbol: string; label: string }[] = [
  { id: 'bitcoin', symbol: 'BTC', label: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', label: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', label: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', label: 'BNB' },
];

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private cache: CacheEntry | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Returns cached quotes, fetching every source on a miss. */
  async getQuotes(): Promise<PriceQuoteDto[]> {
    if (this.cache && this.cache.expires > Date.now()) {
      return this.cache.items;
    }

    const results = await Promise.all([
      this.fetchCrypto(),
      this.fetchGoldSjc(),
      this.fetchUsdVnd(),
    ]);
    const items = results.flat();

    this.cache = { items, expires: Date.now() + CACHE_TTL_MS };
    return items;
  }

  /** CoinGecko simple-price: USD price + 24h change for major coins. */
  private async fetchCrypto(): Promise<PriceQuoteDto[]> {
    const now = new Date().toISOString();
    try {
      const ids = CRYPTO_COINS.map((c) => c.id).join(',');
      // Public CoinGecko rate-limits/blocks datacenter IPs (e.g. Render). A free
      // demo key lifts that; sent via header when COINGECKO_API_KEY is set.
      const apiKey = this.config.get<string>('COINGECKO_API_KEY');
      const res = await axios.get<
        Record<string, { usd: number; usd_24h_change: number }>
      >('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids, vs_currencies: 'usd', include_24hr_change: true },
        headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : undefined,
        timeout: SOURCE_TIMEOUT_MS,
      });
      return CRYPTO_COINS.flatMap((coin) => {
        const row = res.data[coin.id];
        if (!row || typeof row.usd !== 'number') return [];
        return [
          {
            symbol: coin.symbol,
            label: coin.label,
            price: row.usd,
            unit: 'USD',
            changePct:
              typeof row.usd_24h_change === 'number'
                ? row.usd_24h_change
                : null,
            source: 'CoinGecko',
            updatedAt: now,
          },
        ];
      });
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      this.logger.warn(
        `CoinGecko fetch failed${status ? ` (HTTP ${status})` : ''}: ${
          (err as Error).message
        }`,
      );
      return [];
    }
  }

  /** PNJ edge API: VN SJC gold sell price. `giaban` is in thousand VND/chỉ. */
  private async fetchGoldSjc(): Promise<PriceQuoteDto[]> {
    const now = new Date().toISOString();
    try {
      const res = await axios.get<{
        data: { masp: string; tensp: string; giaban: number }[];
      }>('https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price', {
        params: { zone: '00' },
        timeout: SOURCE_TIMEOUT_MS,
      });
      const sjc = res.data?.data?.find((r) => r.masp === 'SJC');
      if (!sjc || typeof sjc.giaban !== 'number') return [];
      return [
        {
          symbol: 'GOLD-SJC',
          label: 'Vàng SJC',
          price: sjc.giaban * 1000,
          unit: 'VND/chỉ',
          changePct: null,
          source: 'PNJ',
          updatedAt: now,
        },
      ];
    } catch (err) {
      this.logger.warn(`PNJ gold fetch failed: ${(err as Error).message}`);
      return [];
    }
  }

  /** ExchangeRate-API open endpoint: USD → VND rate. */
  private async fetchUsdVnd(): Promise<PriceQuoteDto[]> {
    const now = new Date().toISOString();
    try {
      const res = await axios.get<{
        result: string;
        rates: Record<string, number>;
      }>('https://open.er-api.com/v6/latest/USD', {
        timeout: SOURCE_TIMEOUT_MS,
      });
      const vnd = res.data?.rates?.VND;
      if (typeof vnd !== 'number') return [];
      return [
        {
          symbol: 'USD/VND',
          label: 'USD/VND',
          price: vnd,
          unit: 'VND',
          changePct: null,
          source: 'ExchangeRate-API',
          updatedAt: now,
        },
      ];
    } catch (err) {
      this.logger.warn(`USD/VND fetch failed: ${(err as Error).message}`);
      return [];
    }
  }
}
