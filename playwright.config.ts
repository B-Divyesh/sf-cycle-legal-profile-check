import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:8080', trace: 'retain-on-failure' },
  // A fresh checkout needs to compile the Rust server before the first browser
  // can connect. The dependency graph alone can take more than two minutes on
  // a constrained CI worker, so this must not share the normal test timeout.
  webServer: {
    command: 'npm run build && BUILD_SHA=e2e-build-identity cargo run --locked',
    url: 'http://127.0.0.1:8080/health',
    reuseExistingServer: false,
    timeout: 300_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
