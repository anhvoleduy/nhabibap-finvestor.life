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
    // VN gold-price coverage: SJC / PNJ / DOJI / vàng miếng quotes + analysis.
    { source: 'VnEconomy', url: 'https://vneconomy.vn/tai-chinh.rss' },
    { source: 'Vietstock', url: 'https://vietstock.vn/144/hang-hoa.rss' },
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

/**
 * Optional per-category title filter. GOLD feeds are broad VN finance feeds, so
 * we keep only gold-relevant items (SJC / PNJ / DOJI / vàng quotes). Categories
 * without an entry surface every item from their (already focused) feeds.
 */
export const NEWS_FILTERS: Partial<Record<CategoryType, RegExp>> = {
  [CategoryType.GOLD]: /vàng|vang|SJC|PNJ|DOJI|gold|bảo tín|giá vàng/i,
};
