module.exports = {
  testDir: '.',
  testMatch: 'qa-exhaustive.spec.mjs',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  workers: 1,
};
