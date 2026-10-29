import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  projects: [
    { name: 'FullHD-1920', use: { viewport: { width: 1920, height: 1080 } } },
    { name: 'HD-1366', use: { viewport: { width: 1366, height: 768 } } }
  ],
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' },
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  reporter: process.env.CI ? [['github'], ['html', {open: 'never'}]] : 'list'
});
