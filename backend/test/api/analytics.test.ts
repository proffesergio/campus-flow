import request from 'supertest';
import app from '../../src/app';

// DB-free guard test: the summary is tenant-scoped, so a request with no slug is
// rejected before auth/DB. Full aggregation is verified live (see TESTING.md).
describe('analytics dashboard-summary API — guards', () => {
  it('requires a tenant slug', async () => {
    const res = await request(app).get('/api/analytics/dashboard-summary');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
