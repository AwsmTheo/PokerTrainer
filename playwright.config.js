// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // A narrow phone, so a crowded tab bar or a wide table shows up as overflow.
    { name: 'phone', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } } },
  ],
});
