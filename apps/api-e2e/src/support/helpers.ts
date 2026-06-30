import axios from 'axios';
import { Pool } from 'pg';

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}+${Date.now()}@test.local`;
}

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
    if (!rows[0]?.emailVerificationToken)
      throw new Error(`No verification token for ${email}`);
    return rows[0].emailVerificationToken;
  } finally {
    await pool.end();
  }
}

/**
 * Registers, retrieves the verification token from the DB, verifies the email,
 * and returns the auth token from the verification response.
 */
export async function registerAndLogin(
  email = uniqueEmail(),
  password = 'password123',
  name = 'E2E User',
): Promise<{ token: string; userId: string; email: string }> {
  await axios.post('/auth/register', { email, password, name });
  const verificationToken = await getVerificationToken(email);
  const res = await axios.post('/auth/verify-email', {
    token: verificationToken,
  });
  return {
    token: res.data.accessToken,
    userId: res.data.user.id,
    email,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
