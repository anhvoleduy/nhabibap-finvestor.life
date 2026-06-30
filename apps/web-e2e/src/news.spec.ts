import { test, expect, Page } from '@playwright/test';

const API = 'http://localhost:3000/api';

function uniqueEmail(prefix = 'news') {
  return `${prefix}+${Date.now()}@test.local`;
}

async function setupUser(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password = 'password123',
) {
  const res = await request.post(`${API}/auth/register`, {
    data: { email, password, name: 'News E2E User' },
  });
  const body = await res.json();
  return body.accessToken as string;
}

async function loginViaUI(page: Page, email: string, password = 'password123') {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/boards/, { timeout: 10000 });
}

test.describe('Category news section', () => {
  let email: string;
  let token: string;
  let boardId: string;

  test.beforeAll(async ({ request }) => {
    email = uniqueEmail();
    token = await setupUser(request, email);
    const auth = { Authorization: `Bearer ${token}` };

    const board = await (
      await request.post(`${API}/boards`, {
        data: { name: 'News Board' },
        headers: auth,
      })
    ).json();
    boardId = board.id;

    await request.post(`${API}/boards/${boardId}/categories`, {
      data: { type: 'ETF' },
      headers: auth,
    });
  });

  test.beforeEach(async ({ page }) => {
    // Deterministic news payload — independent of live RSS feeds.
    await page.route('**/api/news**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            title: 'VN30 rallies on foreign inflows',
            url: 'https://example.com/vn30',
            source: 'CafeF',
            publishedAt: '2026-06-29T01:00:00.000Z',
          },
        ]),
      }),
    );
    await loginViaUI(page, email);
    await page.goto(`/boards/${boardId}`);
    await page.click('button.tab-btn:has-text("Quỹ ETF")');
  });

  test('renders the news section with a headline link', async ({ page }) => {
    const news = page.locator('.news');
    await expect(news).toBeVisible();
    const link = news.locator('.news__link');
    await expect(link).toContainText('VN30 rallies on foreign inflows');
    await expect(link).toHaveAttribute('href', 'https://example.com/vn30');
    await expect(link).toHaveAttribute('target', '_blank');
  });
});
