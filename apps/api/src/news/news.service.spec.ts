import axios from 'axios';
import { CategoryType } from '@nhabibap-myportfolio/shared-types';
import { NewsService } from './news.service';

jest.mock('axios');
const mockedGet = axios.get as jest.Mock;

const RSS = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title><![CDATA[Giá vàng tăng & lập đỉnh]]></title>
    <link>https://cafef.vn/a.html</link>
    <pubDate>Mon, 29 Jun 2026 08:00:00 +0700</pubDate>
  </item>
  <item>
    <title>No date item</title>
    <link>https://cafef.vn/b.html</link>
  </item>
</channel></rss>`;

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    service = new NewsService();
    mockedGet.mockReset();
  });

  describe('parseRss', () => {
    it('extracts title/link/pubDate, decodes CDATA + entities', () => {
      const items = service.parseRss(RSS, 'CafeF');
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        title: 'Giá vàng tăng & lập đỉnh',
        url: 'https://cafef.vn/a.html',
        source: 'CafeF',
        publishedAt: new Date('Mon, 29 Jun 2026 08:00:00 +0700').toISOString(),
      });
      expect(items[1].publishedAt).toBeNull();
    });

    it('skips items missing title or link', () => {
      const xml = '<rss><item><title>only title</title></item></rss>';
      expect(service.parseRss(xml, 'X')).toEqual([]);
    });
  });

  describe('getNews', () => {
    it('fetches feeds and returns parsed items', async () => {
      mockedGet.mockResolvedValue({ data: RSS });
      const items = await service.getNews(CategoryType.GOLD);
      expect(mockedGet).toHaveBeenCalled();
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].source).toBe('VnEconomy');
    });

    it('GOLD: keeps only gold-relevant items by title keyword', async () => {
      mockedGet.mockResolvedValue({ data: RSS });
      const items = await service.getNews(CategoryType.GOLD);
      expect(items.every((i) => /vàng|sjc|pnj|doji/i.test(i.title))).toBe(true);
      expect(items.find((i) => i.title === 'No date item')).toBeUndefined();
    });

    it('drops stale items older than the max age, even if title matches', async () => {
      const stale = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>Giá vàng hôm nay 23/1</title>
    <link>https://24h.com.vn/old.html</link>
    <pubDate>Wed, 23 Jan 2019 10:14:02 +0700</pubDate>
  </item>
</channel></rss>`;
      mockedGet.mockResolvedValue({ data: stale });
      const items = await service.getNews(CategoryType.GOLD);
      expect(items).toEqual([]);
    });

    it('caches results within the TTL (no refetch)', async () => {
      mockedGet.mockResolvedValue({ data: RSS });
      await service.getNews(CategoryType.CASH);
      const callsAfterFirst = mockedGet.mock.calls.length;
      await service.getNews(CategoryType.CASH);
      expect(mockedGet.mock.calls.length).toBe(callsAfterFirst);
    });

    it('tolerates a failing feed and returns []', async () => {
      mockedGet.mockRejectedValue(new Error('network down'));
      const items = await service.getNews(CategoryType.CRYPTO);
      expect(items).toEqual([]);
    });

    it('sorts newest first across feeds', async () => {
      const older = RSS.replace('29 Jun 2026', '01 Jan 2020');
      mockedGet
        .mockResolvedValueOnce({ data: older })
        .mockResolvedValueOnce({ data: RSS });
      const items = await service.getNews(CategoryType.ETF);
      const times = items
        .map((i) => (i.publishedAt ? Date.parse(i.publishedAt) : 0))
        .filter((t) => t > 0);
      const sorted = [...times].sort((a, b) => b - a);
      expect(times).toEqual(sorted);
    });
  });
});
