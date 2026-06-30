import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

const API = 'http://localhost:3000';

function newPool(): Pool {
  const url = process.env.DATABASE_URL;
  return url
    ? new Pool({ connectionString: url })
    : new Pool({
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5432),
        user: process.env.DATABASE_USER ?? 'appuser',
        password: process.env.DATABASE_PASSWORD ?? 'apppass',
        database: process.env.DATABASE_NAME ?? 'appdb',
      });
}

async function getVerificationToken(email: string): Promise<string> {
  const pool = newPool();
  try {
    const { rows } = await pool.query(
      'SELECT "emailVerificationToken" FROM users WHERE email = $1',
      [email],
    );
    return rows[0]?.emailVerificationToken;
  } finally {
    await pool.end();
  }
}

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

/** Registers and verifies the email so the account can log in. */
async function registerAndVerify(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password = 'password123',
  name = 'E2E Web User',
) {
  await registerUser(request, email, password, name);
  const token = await getVerificationToken(email);
  await request.post(`${API}/auth/verify-email`, { data: { token } });
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
    await registerAndVerify(request, email);

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

  test('redirects to login with check-email notice after registration', async ({
    page,
  }) => {
    const email = uniqueEmail('reg');

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'newpass123');
    await page.locator('input[formControlName="name"]').fill('New User');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/auth\/login\?registered=1/, {
      timeout: 10000,
    });
    await expect(page.locator('.notice-msg')).toBeVisible();
  });

  test('verifying email via link logs the user in', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('verifylink');
    await registerUser(request, email);
    const token = await getVerificationToken(email);

    await page.goto(`/auth/verify-email?token=${token}`);

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
