import axios from 'axios';
import {
  authHeader,
  getVerificationToken,
  registerAndLogin,
  uniqueEmail,
} from '../support/helpers';

describe('Auth', () => {
  describe('POST /auth/register', () => {
    it('creates account and returns a message (no token until verified)', async () => {
      const email = uniqueEmail('reg');
      const res = await axios.post('/auth/register', {
        email,
        password: 'secret123',
        name: 'Test User',
      });

      expect(res.status).toBe(201);
      expect(res.data.message).toBeTruthy();
      expect(res.data).not.toHaveProperty('accessToken');
    });

    it('rejects duplicate email with 409', async () => {
      const email = uniqueEmail('dup');
      await axios.post('/auth/register', {
        email,
        password: 'secret123',
        name: 'First',
      });

      const res = await axios.post(
        '/auth/register',
        { email, password: 'other123', name: 'Second' },
        { validateStatus: () => true },
      );

      expect(res.status).toBe(409);
    });

    it('rejects invalid email with 400', async () => {
      const res = await axios.post(
        '/auth/register',
        { email: 'not-an-email', password: 'secret123', name: 'Test' },
        { validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });

    it('rejects password shorter than 6 chars with 400', async () => {
      const res = await axios.post(
        '/auth/register',
        { email: uniqueEmail(), password: '123', name: 'Test' },
        { validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('verifies email with valid token and returns auth token', async () => {
      const email = uniqueEmail('verify');
      await axios.post('/auth/register', {
        email,
        password: 'secret123',
        name: 'Verify User',
      });
      const token = await getVerificationToken(email);

      const res = await axios.post('/auth/verify-email', { token });

      expect(res.status).toBe(201);
      expect(res.data.accessToken).toBeTruthy();
      expect(res.data.user.email).toBe(email);
      expect(res.data.user).not.toHaveProperty('passwordHash');
    });

    it('rejects an unknown token with 400', async () => {
      const res = await axios.post(
        '/auth/verify-email',
        { token: 'nonexistent-token' },
        { validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('returns 200 for an unverified account', async () => {
      const email = uniqueEmail('resend');
      await axios.post('/auth/register', {
        email,
        password: 'secret123',
        name: 'Resend User',
      });

      const res = await axios.post('/auth/resend-verification', { email });

      expect(res.status).toBe(200);
      expect(res.data.message).toBeTruthy();
    });

    it('returns 200 even for an unknown email (no enumeration)', async () => {
      const res = await axios.post('/auth/resend-verification', {
        email: 'nobody-unknown@test.local',
      });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /auth/login', () => {
    it('returns token for valid, verified credentials', async () => {
      const { email } = await registerAndLogin(
        uniqueEmail('login'),
        'correct123',
      );

      const res = await axios.post('/auth/login', {
        email,
        password: 'correct123',
      });

      expect(res.status).toBe(201);
      expect(res.data.accessToken).toBeTruthy();
      expect(res.data.user.email).toBe(email);
    });

    it('allows login before email is verified (soft gating)', async () => {
      const email = uniqueEmail('unverified');
      await axios.post('/auth/register', {
        email,
        password: 'correct123',
        name: 'Unverified User',
      });

      const res = await axios.post('/auth/login', {
        email,
        password: 'correct123',
      });

      expect(res.status).toBe(201);
      expect(res.data.accessToken).toBeTruthy();
      expect(res.data.user.emailVerified).toBe(false);
    });

    it('rejects wrong password with 401', async () => {
      const email = uniqueEmail('badpw');
      await axios.post('/auth/register', {
        email,
        password: 'correct123',
        name: 'User',
      });

      const res = await axios.post(
        '/auth/login',
        { email, password: 'wrongpass' },
        { validateStatus: () => true },
      );

      expect(res.status).toBe(401);
    });

    it('rejects unknown email with 401', async () => {
      const res = await axios.post(
        '/auth/login',
        { email: 'nobody@test.local', password: 'secret123' },
        { validateStatus: () => true },
      );

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('returns current user for valid token', async () => {
      const { token, email } = await registerAndLogin();

      const res = await axios.get('/auth/me', { headers: authHeader(token) });

      expect(res.status).toBe(200);
      expect(res.data.email).toBe(email);
    });

    it('returns 401 without token', async () => {
      const res = await axios.get('/auth/me', { validateStatus: () => true });

      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await axios.get('/auth/me', {
        headers: { Authorization: 'Bearer invalid.token.here' },
        validateStatus: () => true,
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/search', () => {
    it('returns matching users by email fragment', async () => {
      const { token, email } = await registerAndLogin(uniqueEmail('srch'));

      const fragment = email.split('@')[0].slice(-6);
      const res = await axios.get(`/users/search?email=${fragment}`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.some((u: { email: string }) => u.email === email)).toBe(
        true,
      );
    });

    it('returns empty array for no match', async () => {
      const { token } = await registerAndLogin();

      const res = await axios.get('/users/search?email=zzznomatch999', {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });

    it('requires auth', async () => {
      const res = await axios.get('/users/search?email=test', {
        validateStatus: () => true,
      });

      expect(res.status).toBe(401);
    });
  });
});
