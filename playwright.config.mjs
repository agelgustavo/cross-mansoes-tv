import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './tests',
 testMatch: '**/*.spec.mjs',
 fullyParallel: true,
 retries: 1,
 timeout: 30000,
 use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
 webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI }
});
