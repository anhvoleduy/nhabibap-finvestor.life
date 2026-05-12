import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});

describe('GET /api/health', () => {
  it('returns 200 with status ok + timestamp', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(typeof res.data.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(res.data.timestamp))).toBe(false);
  });
});

describe('GET /api/ready', () => {
  it('returns 200 with db ok + latency when DB reachable', async () => {
    const res = await axios.get('/api/ready');

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(res.data.db).toBe('ok');
    expect(typeof res.data.latencyMs).toBe('number');
    expect(res.data.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof res.data.timestamp).toBe('string');
  });
});
