import request from 'supertest';
import app from '../../src/app';

// DB-free guard test: audit listing is tenant-scoped and admin-only. Without a
// slug the request is rejected before auth/DB. Full behaviour (entity parsing,
// role guard, metadata sanitisation) is covered by the live test in TESTING.md.
describe('audit API — guards', () => {
  it('requires a tenant slug', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
