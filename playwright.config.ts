import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  workers: 3,
  retries: 2,
  use: {
    baseURL: process.env.BASE_URL || 'https://blog.lwtdzh.ip-ddns.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
