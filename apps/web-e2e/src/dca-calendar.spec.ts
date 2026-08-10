import { test, expect, Page } from '@playwright/test';
import { getVerificationToken } from './support/auth';

const API = 'http://localhost:3000/api';

function uniqueEmail(prefix = 'dcacal') {
  return `${prefix}+${Date.now()}@test.local`;
}

async function setupUser(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password = 'password123',
) {
  await request.post(`${API}/auth/register`, {
    data: { email, password, name: 'DCA Calendar E2E User' },
  });
  const token = await getVerificationToken(email);
  const res = await request.post(`${API}/auth/verify-email`, {
    data: { token },
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

test.describe('DCA reminder calendar', () => {
  let email: string;
  let token: string;
  let boardId: string;
  let catId: string;

  test.beforeAll(async ({ request }) => {
    email = uniqueEmail();
    token = await setupUser(request, email);
    const auth = { Authorization: `Bearer ${token}` };

    const board = await (
      await request.post(`${API}/boards`, {
        data: { name: 'Calendar Board' },
        headers: auth,
      })
    ).json();
    boardId = board.id;

    const cat = await (
      await request.post(`${API}/boards/${boardId}/categories`, {
        data: { type: 'ETF' },
        headers: auth,
      })
    ).json();
    catId = cat.id;

    const asset = await (
      await request.post(
        `${API}/boards/${boardId}/categories/${catId}/assets`,
        { data: { name: 'VN30 ETF', capital: 1000000 }, headers: auth },
      )
    ).json();

    // Anchor date in the far past + no lastDoneDate -> overdue reminder,
    // which the calendar should surface on today's cell.
    await request.patch(
      `${API}/boards/${boardId}/categories/${catId}/assets/${asset.id}`,
      {
        data: {
          metadata: { dca: { frequency: 'WEEKLY', anchorDate: '2020-01-01' } },
        },
        headers: auth,
      },
    );
  });

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto('/dca-calendar');
  });

  test('shows the overdue reminder on today, and marking done clears it', async ({
    page,
  }) => {
    const todayCell = page.locator('.cal-cell--today');
    await expect(todayCell).toBeVisible();
    await expect(todayCell.locator('.cal-chip--due')).toBeVisible({
      timeout: 10000,
    });
    await expect(todayCell).toContainText('VN30 ETF');

    await todayCell.locator('.cal-chip__done').click();

    await expect(todayCell.locator('.cal-chip--due')).toHaveCount(0, {
      timeout: 10000,
    });
  });

  test('month navigation moves the visible label', async ({ page }) => {
    // App defaults to Vietnamese ('Tháng sau' / 'Tháng trước').
    const label = page.locator('.cal-toolbar__label');
    const before = await label.textContent();
    await page.click('button[aria-label="Tháng sau"]');
    await expect(label).not.toHaveText(before ?? '');
    await page.click('button[aria-label="Tháng trước"]');
    await expect(label).toHaveText(before ?? '');
  });
});
