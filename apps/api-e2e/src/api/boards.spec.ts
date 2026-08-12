import axios from 'axios';
import { authHeader, registerAndLogin, uniqueEmail } from '../support/helpers';

describe('Boards', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    ({ token, userId } = await registerAndLogin());
  });

  describe('GET /boards', () => {
    it('returns empty list for new user', async () => {
      const { token: freshToken } = await registerAndLogin();
      const res = await axios.get('/boards', {
        headers: authHeader(freshToken),
      });

      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });

    it('requires auth', async () => {
      const res = await axios.get('/boards', { validateStatus: () => true });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /boards', () => {
    it('creates board and returns it', async () => {
      const res = await axios.post(
        '/boards',
        { name: 'My Portfolio' },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(201);
      expect(res.data.name).toBe('My Portfolio');
      expect(res.data.id).toBeTruthy();
      expect(res.data.ownerId).toBe(userId);
      expect(res.data.role).toBe('OWNER');
    });

    it('rejects empty name with 400', async () => {
      const res = await axios.post(
        '/boards',
        { name: '' },
        { headers: authHeader(token), validateStatus: () => true },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('Board CRUD lifecycle', () => {
    let boardId: string;

    beforeAll(async () => {
      const res = await axios.post(
        '/boards',
        { name: 'CRUD Board' },
        { headers: authHeader(token) },
      );
      boardId = res.data.id;
    });

    it('GET /boards lists created board', async () => {
      const res = await axios.get('/boards', { headers: authHeader(token) });

      expect(res.status).toBe(200);
      expect(res.data.some((b: { id: string }) => b.id === boardId)).toBe(true);
    });

    it('GET /boards/:id returns board detail', async () => {
      const res = await axios.get(`/boards/${boardId}`, {
        headers: authHeader(token),
      });

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(boardId);
      expect(res.data.name).toBe('CRUD Board');
      expect(res.data.members).toBeDefined();
    });

    it('PATCH /boards/:id updates board name', async () => {
      const res = await axios.patch(
        `/boards/${boardId}`,
        { name: 'Renamed Board' },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Renamed Board');
    });

    it('PATCH /boards/:id updates bank/cash balance', async () => {
      const res = await axios.patch(
        `/boards/${boardId}`,
        { bankBalance: 5000000, cashBalance: 1000000 },
        { headers: authHeader(token) },
      );

      expect(res.status).toBe(200);
      expect(res.data.bankBalance).toBe(5000000);
      expect(res.data.cashBalance).toBe(1000000);
    });

    it('GET /boards/:id returns 403 for other user', async () => {
      const { token: otherToken } = await registerAndLogin();
      const res = await axios.get(`/boards/${boardId}`, {
        headers: authHeader(otherToken),
        validateStatus: () => true,
      });

      expect(res.status).toBe(403);
    });

    describe('Members', () => {
      let memberToken: string;
      let memberUserId: string;
      let memberEmail: string;

      beforeAll(async () => {
        ({
          token: memberToken,
          userId: memberUserId,
          email: memberEmail,
        } = await registerAndLogin(uniqueEmail('member')));
      });

      it('POST /boards/:id/members shares board', async () => {
        const res = await axios.post(
          `/boards/${boardId}/members`,
          { email: memberEmail, role: 'EDITOR' },
          { headers: authHeader(token) },
        );

        expect(res.status).toBe(201);
        expect(res.data.userId).toBe(memberUserId);
        expect(res.data.role).toBe('EDITOR');
      });

      it('shared member can GET /boards/:id', async () => {
        const res = await axios.get(`/boards/${boardId}`, {
          headers: authHeader(memberToken),
        });

        expect(res.status).toBe(200);
        expect(res.data.id).toBe(boardId);
        expect(res.data.role).toBe('EDITOR');
      });

      it('DELETE /boards/:id/members/:userId removes member', async () => {
        const res = await axios.delete(
          `/boards/${boardId}/members/${memberUserId}`,
          { headers: authHeader(token), validateStatus: () => true },
        );

        expect(res.status).toBe(204);
      });

      it('removed member can no longer GET /boards/:id', async () => {
        const res = await axios.get(`/boards/${boardId}`, {
          headers: authHeader(memberToken),
          validateStatus: () => true,
        });

        expect(res.status).toBe(403);
      });
    });

    it('DELETE /boards/:id removes board', async () => {
      const res = await axios.delete(`/boards/${boardId}`, {
        headers: authHeader(token),
        validateStatus: () => true,
      });

      expect(res.status).toBe(204);
    });

    it('GET /boards/:id returns 404 after delete', async () => {
      const res = await axios.get(`/boards/${boardId}`, {
        headers: authHeader(token),
        validateStatus: () => true,
      });

      expect(res.status).toBe(404);
    });
  });
});
