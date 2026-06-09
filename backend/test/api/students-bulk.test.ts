import request from 'supertest';
import app from '../../src/app';

// DB-free guard tests: these are tenant-scoped, so a request with no slug is
// rejected by the tenant middleware before auth/DB. Full behaviour verified live.
describe('students bulk/import + notify — guards', () => {
  it('bulk requires a tenant slug', async () => {
    const r = await request(app).post('/api/students/bulk').send({ action: 'deactivate', ids: ['ck1a2b3c4d5e6f7g8h9i0j1k2'] });
    expect(r.status).toBe(400);
  });
  it('import requires a tenant slug', async () => {
    const r = await request(app).post('/api/students/import').send({ rows: [{ firstName: 'A' }] });
    expect(r.status).toBe(400);
  });
  it('notify-students requires a tenant slug', async () => {
    const r = await request(app)
      .post('/api/notifications/notify-students')
      .send({ studentIds: ['ck1a2b3c4d5e6f7g8h9i0j1k2'], subject: 'x', message: 'y', channels: ['in_app'] });
    expect(r.status).toBe(400);
  });
});
