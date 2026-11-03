// Visual suite: every built page against its prototype board. Run: npm run test:visual (after npm run build).
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/visual',
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { headless: true },
  webServer: [
    { command: 'python3 -m http.server 5190 --directory ../design/prototype', port: 5190, reuseExistingServer: true },
    { command: 'python3 -m http.server 5191 --directory dist', port: 5191, reuseExistingServer: true },
  ],
});
