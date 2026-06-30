import { test, expect, Page } from '@playwright/test';
import { getVerificationToken } from './support/auth';

const API = 'http://localhost:3000/api';

function uniqueEmail(prefix = 'dca') {
  return `${prefix}+${Date.now()}@test.local`;
}

async function setupUser(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password = 'password123',
) {
  await request.post(`${API}/auth/register`, {
    data: { email, password, name: 'DCA E2E User' },
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

test.describe('DCA reminder', () => {
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
        data: { name: 'DCA Board' },
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

    await request.post(`${API}/boards/${boardId}/categories/${catId}/assets`, {
      data: { name: 'VN30 ETF', capital: 1000000 },
      headers: auth,
    });
  });

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto(`/boards/${boardId}`);
    await page.click('button.tab-btn:has-text("Quỹ ETF")');
    await expect(page.locator('.assets-table')).toContainText('VN30 ETF', {
      timeout: 10000,
    });
  });

  test('sets a weekly DCA reminder and shows next-due badge', async ({
    page,
  }) => {
    await page.click('.assets-table tbody button:has-text("event_repeat")');
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    // Past anchor date -> reminder becomes due immediately.
    // Datepicker input uses en-GB display format (dd/mm/yyyy).
    await dialog.locator('input').first().fill('01/01/2020');
    await dialog.locator('button:has-text("Lưu")').click();

    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.dca-badge--due')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('.dca-badge--due')).toContainText('ĐẾN HẠN');
  });

  test('removes a reminder', async ({ page }) => {
    await page.click('.assets-table tbody button:has-text("event_repeat")');
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    await dialog.locator('button:has-text("Xoá nhắc")').click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.dca-badge')).toHaveCount(0);
  });
});
