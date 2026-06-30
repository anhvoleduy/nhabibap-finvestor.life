import axios from 'axios';
import { authHeader, registerAndLogin } from '../support/helpers';

describe('Prices', () => {
  let token: string;

  beforeAll(async () => {
    ({ token } = await registerAndLogin());
  });

  describe('GET /prices', () => {
    it('requires auth', async () => {
      const res = await axios.get('/prices', {
        validateStatus: () => true,
      });
      expect(res.status).toBe(401);
    });

    it('returns an array of price quotes', async () => {
      const res = await axios.get('/prices', {
        headers: authHeader(token),
        // External price sources can be slow; tolerate up to 15s.
        timeout: 15000,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      // Sources may be unreachable in CI; only assert shape when present.
      for (const q of res.data) {
        expect(typeof q.symbol).toBe('string');
        expect(typeof q.label).toBe('string');
        expect(typeof q.price).toBe('number');
        expect(typeof q.unit).toBe('string');
        expect(typeof q.source).toBe('string');
        expect(q.changePct === null || typeof q.changePct === 'number').toBe(
          true,
        );
      }
    });
  });
});
