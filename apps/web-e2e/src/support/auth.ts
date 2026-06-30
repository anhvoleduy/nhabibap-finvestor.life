import type { APIRequestContext } from '@playwright/test';
import { Pool } from 'pg';

export const API = 'http://localhost:3000';

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

/** Reads the verification token a register call persisted for the given email. */
export async function getVerificationToken(email: string): Promise<string> {
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

/**
 * Registers, verifies the email via the persisted token, and returns the
 * access token from the verification response.
 */
export async function setupUser(
  request: APIRequestContext,
  email: string,
  password = 'password123',
  name = 'E2E User',
): Promise<string> {
  await request.post(`${API}/auth/register`, {
    data: { email, password, name },
  });
  const token = await getVerificationToken(email);
  const res = await request.post(`${API}/auth/verify-email`, {
    data: { token },
  });
  const body = await res.json();
  return body.accessToken as string;
}
