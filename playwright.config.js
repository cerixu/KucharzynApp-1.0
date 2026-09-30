const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.KUCHARZYNA_URL || 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  },
  projects: [
    {
      name: 'iphone-17-pro-max',
      use: {
        ...devices['iPhone 15 Pro Max'],
        viewport: { width: 440, height: 956 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'desktop-smoke',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 }
      }
    }
  ]
});
