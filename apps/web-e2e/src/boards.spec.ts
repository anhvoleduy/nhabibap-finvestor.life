import { test, expect, Page } from '@playwright/test';

const API = 'http://localhost:3000';

function uniqueEmail(prefix = 'brd') {
  return `${prefix}+${Date.now()}@test.local`;
}

async function setupUser(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password = 'password123',
) {
  const res = await request.post(`${API}/auth/register`, {
    data: { email, password, name: 'Board E2E User' },
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

test.describe('Board list', () => {
  let email: string;

  test.beforeEach(async ({ page, request }) => {
    email = uniqueEmail();
    await setupUser(request, email);
    await loginViaUI(page, email);
  });

  test('shows board list page heading', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Danh mục đầu tư');
  });

  test('shows empty state when no boards', async ({ page }) => {
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('opens create board dialog on "Tạo mới" click', async ({ page }) => {
    await page.click('button:has-text("Tạo mới")');
    await expect(page.locator('mat-dialog-container')).toBeVisible();
  });

  test('creates board and shows it in list', async ({ page }) => {
    await page.click('button:has-text("Tạo mới")');
    await page.locator('mat-dialog-container input').fill('My Test Portfolio');
    await page.locator('mat-dialog-container button[type="submit"]').click();

    await expect(page.locator('.board-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.board-card')).toContainText(
      'My Test Portfolio',
    );
  });

  test('navigates to board detail on card click', async ({ page, request }) => {
    const token = await setupUser(request, uniqueEmail('nav'));
    await request.post(`${API}/boards`, {
      data: { name: 'Nav Board' },
      headers: { Authorization: `Bearer ${token}` },
    });

    await loginViaUI(page, email);

    await page.click('button:has-text("Tạo mới")');
    await page.locator('mat-dialog-container input').fill('Click Board');
    await page.locator('mat-dialog-container button[type="submit"]').click();

    await page.locator('.board-card:has-text("Click Board")').click();
    await expect(page).toHaveURL(/\/boards\/[a-z0-9-]+$/, { timeout: 10000 });
  });

  test('shows logout button and user name in toolbar', async ({ page }) => {
    await expect(
      page.locator('mat-toolbar button[mattooltip="Đăng xuất"]'),
    ).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.click('mat-toolbar button[mattooltip="Đăng xuất"]');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

test.describe('Board detail', () => {
  let email: string;
  let token: string;
  let boardId: string;

  test.beforeAll(async ({ request }) => {
    email = uniqueEmail('detail');
    token = await setupUser(request, email);
    const res = await request.post(`${API}/boards`, {
      data: { name: 'Detail Test Board' },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    boardId = body.id;
  });

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto(`/boards/${boardId}`);
    await expect(page.locator('mat-toolbar span')).toContainText(
      'Detail Test Board',
      { timeout: 10000 },
    );
  });

  test('shows board name in toolbar', async ({ page }) => {
    await expect(page.locator('mat-toolbar')).toContainText(
      'Detail Test Board',
    );
  });

  test('shows Tổng quan tab by default', async ({ page }) => {
    await expect(
      page.locator('.tab-btn--active, button.tab-btn--active'),
    ).toContainText('Tổng quan');
  });

  test('shows "Cập nhật giá trị" button', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Cập nhật giá trị")'),
    ).toBeVisible();
  });

  test('"Cập nhật giá trị" navigates to daily entry page', async ({ page }) => {
    await page.click('button:has-text("Cập nhật giá trị")');
    await expect(page).toHaveURL(/\/boards\/[a-z0-9-]+\/entry/, {
      timeout: 10000,
    });
  });

  test('back arrow navigates to board list', async ({ page }) => {
    await page.click('mat-toolbar button[routerlink="/boards"]');
    await expect(page).toHaveURL(/\/boards$/, { timeout: 10000 });
  });

  test('rename dialog opens and updates board name', async ({ page }) => {
    await page.click('mat-toolbar button[mattooltip="Đổi tên"]');
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    await dialog.locator('input').fill('Renamed Board');
    await dialog.locator('button[type="submit"]').click();

    await expect(page.locator('mat-toolbar span')).toContainText(
      'Renamed Board',
      { timeout: 10000 },
    );
  });
});
