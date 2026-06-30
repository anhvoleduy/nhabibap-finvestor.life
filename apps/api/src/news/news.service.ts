import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CategoryType, NewsItemDto } from '@nhabibap-myportfolio/shared-types';
import { FeedSource, NEWS_FEEDS, NEWS_FILTERS } from './news.feeds';

interface CacheEntry {
  items: NewsItemDto[];
  expires: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const FEED_TIMEOUT_MS = 8000;
const MAX_ITEMS_PER_TYPE = 20;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly cache = new Map<CategoryType, CacheEntry>();

  /** Returns cached news for a category, fetching + parsing feeds on a miss. */
  async getNews(type: CategoryType): Promise<NewsItemDto[]> {
    const cached = this.cache.get(type);
    if (cached && cached.expires > Date.now()) {
      return cached.items;
    }

    const feeds = NEWS_FEEDS[type] ?? [];
    const results = await Promise.all(
      feeds.map((feed) => this.fetchFeed(feed)),
    );

    const filter = NEWS_FILTERS[type];
    const items = results
      .flat()
      .filter((item) => !filter || filter.test(item.title))
      .sort((a, b) => this.publishedTime(b) - this.publishedTime(a))
      .slice(0, MAX_ITEMS_PER_TYPE);

    this.cache.set(type, { items, expires: Date.now() + CACHE_TTL_MS });
    return items;
  }

  private publishedTime(item: NewsItemDto): number {
    const t = item.publishedAt ? Date.parse(item.publishedAt) : NaN;
    return Number.isNaN(t) ? 0 : t;
  }

  private async fetchFeed(feed: FeedSource): Promise<NewsItemDto[]> {
    try {
      const res = await axios.get<string>(feed.url, {
        timeout: FEED_TIMEOUT_MS,
        responseType: 'text',
        headers: { 'User-Agent': 'FinvestorBot/1.0 (+news)' },
      });
      return this.parseRss(res.data, feed.source);
    } catch (err) {
      // A dead/slow feed must not break the whole response.
      this.logger.warn(
        `Failed to fetch feed ${feed.url}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Minimal RSS 2.0 parser. Extracts <item> blocks and pulls title/link/pubDate.
   * Deliberately dependency-free; tolerant of CDATA and attribute-form <link>.
   */
  parseRss(xml: string, source: string): NewsItemDto[] {
    const items: NewsItemDto[] = [];
    const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
    const blocks = xml.match(itemRe) ?? [];

    for (const block of blocks) {
      const title = this.tagText(block, 'title');
      const url = this.tagText(block, 'link');
      if (!title || !url) continue;
      const pubDate = this.tagText(block, 'pubDate');
      const parsed = pubDate ? Date.parse(pubDate) : NaN;
      items.push({
        title,
        url,
        source,
        publishedAt: Number.isNaN(parsed)
          ? null
          : new Date(parsed).toISOString(),
      });
    }
    return items;
  }

  private tagText(block: string, tag: string): string {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = block.match(re);
    if (!m) return '';
    return this.decode(this.stripCdata(m[1]).trim());
  }

  private stripCdata(s: string): string {
    const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
    return m ? m[1] : s;
  }

  private decode(s: string): string {
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }
}
