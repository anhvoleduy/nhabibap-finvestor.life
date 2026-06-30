import { CategoryType } from '@nhabibap-myportfolio/shared-types';

export interface FeedSource {
  /** Human-readable source name surfaced to the UI. */
  source: string;
  /** RSS/Atom feed URL. */
  url: string;
}

/**
 * Curated RSS feeds per asset category. Kept in one place so a dead feed is a
 * one-line fix. URLs point at public RSS endpoints; if a feed disappears the
 * service degrades gracefully (that source is skipped, others still serve).
 */
export const NEWS_FEEDS: Record<CategoryType, FeedSource[]> = {
  [CategoryType.GOLD]: [
    { source: 'CafeF', url: 'https://cafef.vn/vang.rss' },
    {
      source: 'Vietstock',
      url: 'https://vietstock.vn/144/hang-hoa.rss',
    },
  ],
  [CategoryType.OPEN_FUND]: [
    { source: 'CafeF', url: 'https://cafef.vn/thi-truong-chung-khoan.rss' },
    { source: 'Vietstock', url: 'https://vietstock.vn/737/chung-khoan.rss' },
  ],
  [CategoryType.ETF]: [
    { source: 'CafeF', url: 'https://cafef.vn/thi-truong-chung-khoan.rss' },
    { source: 'Vietstock', url: 'https://vietstock.vn/737/chung-khoan.rss' },
  ],
  [CategoryType.CRYPTO]: [
    {
      source: 'CoinDesk',
      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    },
    { source: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  ],
  [CategoryType.SAVINGS]: [
    {
      source: 'CafeF',
      url: 'https://cafef.vn/tai-chinh-ngan-hang.rss',
    },
  ],
  [CategoryType.CASH]: [
    { source: 'CafeF', url: 'https://cafef.vn/tai-chinh-quoc-te.rss' },
  ],
};
