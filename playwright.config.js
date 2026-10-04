import { defineConfig } from '@playwright/test'
import { testBase } from './scripts/test-base.js'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 40000,
  use: { baseURL: `http://127.0.0.1:4173${testBase}`, viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/preview-test.js', url: `http://127.0.0.1:4173${testBase}`, reuseExistingServer: false, timeout: 60000 },
})
