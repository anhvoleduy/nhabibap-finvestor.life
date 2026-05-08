import axios from 'axios';

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}+${Date.now()}@test.local`;
}

export async function registerAndLogin(
  email = uniqueEmail(),
  password = 'password123',
  name = 'E2E User',
): Promise<{ token: string; userId: string; email: string }> {
  const res = await axios.post('/auth/register', { email, password, name });
  return {
    token: res.data.accessToken,
    userId: res.data.user.id,
    email,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
