import { test, expect } from '@playwright/test';

const API = 'http://localhost:3000';

async function registerUser(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password = 'password123',
  name = 'E2E Web User',
) {
  await request.post(`${API}/auth/register`, {
    data: { email, password, name },
  });
}

function uniqueEmail(prefix = 'web') {
  return `${prefix}+${Date.now()}@test.local`;
}

test.describe('Auth guard', () => {
  test('redirects unauthenticated user from /boards to /auth/login', async ({
    page,
  }) => {
    await page.goto('/boards');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirects unauthenticated user from / to /auth/login', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('shows login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Đăng nhập');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows link to register page', async ({ page }) => {
    await expect(page.locator('a[href*="/auth/register"]')).toBeVisible();
  });

  test('submit button disabled when form empty', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'nobody@test.local');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-msg')).toBeVisible();
  });

  test('navigates to /boards after successful login', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('login');
    await registerUser(request, email);

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/boards/, { timeout: 10000 });
  });
});

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('shows register form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('navigates to /boards after successful registration', async ({
    page,
  }) => {
    const email = uniqueEmail('reg');

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'newpass123');
    await page.locator('input[formControlName="name"]').fill('New User');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/boards/, { timeout: 10000 });
  });

  test('shows error on duplicate email', async ({ page, request }) => {
    const email = uniqueEmail('dup');
    await registerUser(request, email);

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'newpass123');
    await page.locator('input[formControlName="name"]').fill('Dup User');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-msg')).toBeVisible();
  });
});
