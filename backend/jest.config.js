/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  // tsconfig.test.json enables isolatedModules (transpile-only) so the suite
  // runs fast and decoupled from the strict src build config.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  clearMocks: true,
  // Pure/validator tests need no DB; integration tests (tagged *.int.test.ts)
  // can be added later and gated behind a running Postgres.
  testTimeout: 10000,
};
