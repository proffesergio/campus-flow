import request from 'supertest';
import app from '../../src/app';

// Smoke tests that exercise the real Express app (middleware stack, routing)
// without needing a database — these endpoints sit outside tenant resolution.
describe('API smoke', () => {
  it('GET /health returns ok with uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET / returns API metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('CampusFlow API');
  });

  it('GET /api/openapi.json serves the OpenAPI spec', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi || res.body.swagger).toBeDefined();
  });

  it('rejects an API call without a tenant slug', async () => {
    // /api/* (except auth + health) requires X-School-Slug in dev / a subdomain.
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
