import axios from 'axios';
import { authHeader, registerAndLogin } from '../support/helpers';

describe('News', () => {
  let token: string;

  beforeAll(async () => {
    ({ token } = await registerAndLogin());
  });

  describe('GET /news', () => {
    it('requires auth', async () => {
      const res = await axios.get('/news?type=GOLD', {
        validateStatus: () => true,
      });
      expect(res.status).toBe(401);
    });

    it('rejects an unknown category type with 400', async () => {
      const res = await axios.get('/news?type=BOGUS', {
        headers: authHeader(token),
        validateStatus: () => true,
      });
      expect(res.status).toBe(400);
    });

    it('returns an array of news items for a valid type', async () => {
      const res = await axios.get('/news?type=GOLD', {
        headers: authHeader(token),
        // External feeds can be slow; tolerate up to 15s.
        timeout: 15000,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      // Feeds may be empty/unreachable in CI; only assert shape when present.
      for (const item of res.data) {
        expect(typeof item.title).toBe('string');
        expect(typeof item.url).toBe('string');
        expect(typeof item.source).toBe('string');
      }
    });
  });
});
