// Runs before any module (including src/config/env.ts) is imported by a test.
// Provides safe, deterministic env values so importing the app never calls
// process.exit(1). Real env vars (e.g. a live test DATABASE_URL) take precedence.
process.env.NODE_ENV = process.env.NODE_ENV === 'test' ? 'test' : 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://test:test@localhost:5432/campusflow_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long-000';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test-refresh-secret-at-least-32-characters-000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.APP_DOMAIN = process.env.APP_DOMAIN || 'campusflow.app';
