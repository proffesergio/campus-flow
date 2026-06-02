import request from 'supertest';
import app from '../../src/app';

// DB-free guard tests: these requests fail at the tenant/auth layer before any
// DB access. Full data + ownership behaviour is covered by the live integration
// test documented in TESTING.md.
describe('parents API — guards', () => {
  it('requires a tenant slug', async () => {
    const res = await request(app).get('/api/parents/me/children');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('child dashboard route is mounted under tenant resolution', async () => {
    const res = await request(app).get('/api/parents/me/children/abc/dashboard');
    expect(res.status).toBe(400); // no slug → blocked before auth/handler
  });
});
