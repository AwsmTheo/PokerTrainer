// @ts-check
// Checks every tab of the trainer page without knowing what the tabs are.
// It relies on the conventions every drill follows today:
//   - tabs are [role=tab] buttons whose aria-controls names their [role=tabpanel];
//   - answer buttons carry a <kbd> shortcut and are disabled once you answer;
//   - the "next" button that appears after an answer carries <kbd>N</kbd>.
// A new drill that keeps these conventions is covered without editing this file.
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');

const PAGE_URL = pathToFileURL(path.join(__dirname, '..', 'preflop-seat-drill.html')).href;
const ROUNDS = 40;

test.beforeEach(async ({ page }, testInfo) => {
  const problems = [];
  page.on('pageerror', err => problems.push(`page error: ${err.message}`));
  page.on('console', msg => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
  testInfo['problems'] = problems;
  // Keep the run offline and deterministic: answer web font requests with nothing.
  await page.route(/^https?:\/\//, route => route.fulfill({ status: 200, body: '' }));
  await page.goto(PAGE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo['problems'], 'no errors in the console').toEqual([]);
});

/** @param {import('@playwright/test').Page} page */
async function tabsOf(page) {
  const tabs = page.getByRole('tab');
  const n = await tabs.count();
  expect(n, 'the page has tabs').toBeGreaterThan(0);
  const out = [];
  for (let i = 0; i < n; i++) {
    const tab = tabs.nth(i);
    out.push({ tab, name: (await tab.locator('b').first().textContent() || await tab.textContent() || '').trim(),
               panelId: await tab.getAttribute('aria-controls') });
  }
  return out;
}

/** @param {import('@playwright/test').Page} page */
async function noSideScroll(page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, 'page does not scroll sideways').toBeLessThanOrEqual(client);
}

test('each tab shows only its own panel', async ({ page }) => {
  const tabs = await tabsOf(page);
  for (const { tab, panelId } of tabs) {
    expect(panelId, 'tab names its panel').toBeTruthy();
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    for (const other of tabs) {
      const panel = page.locator(`#${other.panelId}`);
      if (other.panelId === panelId) await expect(panel).toBeVisible();
      else await expect(panel).toBeHidden();
    }
    await noSideScroll(page);
  }
});

test('the open tab survives a reload', async ({ page }) => {
  const tabs = await tabsOf(page);
  const last = tabs[tabs.length - 1];
  await last.tab.click();
  await page.reload();
  await expect(page.getByRole('tab', { selected: true })).toHaveAttribute('aria-controls', last.panelId);
});

test.describe('drills', () => {
  // One test per tab, named after it. Tabs are read from the page file so a new tab gets its own test.
  const fs = require('fs');
  const html = fs.readFileSync(path.join(__dirname, '..', 'preflop-seat-drill.html'), 'utf8');
  const names = [...html.matchAll(/role="tab"[^>]*aria-controls="([^"]+)"/g)].map(m => m[1]);

  test('the page file has tabs to drill', async ({ page }) => {
    expect(names.length).toBeGreaterThan(0);
    expect(names.length, 'the regex finds every tab the browser sees').toBe(await page.getByRole('tab').count());
  });

  for (const panelId of names) {
    test(`answers ${ROUNDS} questions in ${panelId}`, async ({ page }) => {
      const tab = page.locator(`[role=tab][aria-controls="${panelId}"]`);
      await tab.click();
      const panel = page.locator(`#${panelId}`);
      await expect(panel).toBeVisible();

      const nKey = page.locator('kbd', { hasText: /^N$/ });
      const answers = panel.locator('button:visible:has(kbd)').filter({ hasNot: nKey });
      const next = panel.locator('button:visible:has(kbd)').filter({ has: nKey });

      for (let round = 0; round < ROUNDS; round++) {
        const open = answers.and(page.locator(':enabled'));
        await expect(open.first(), `round ${round + 1}: a question is waiting`).toBeVisible();
        const choices = await open.count();
        await open.nth(Math.floor(Math.random() * choices)).click();
        await expect(open, `round ${round + 1}: answer buttons lock after answering`).toHaveCount(0);
        await expect(next, `round ${round + 1}: a next button appears`).toHaveCount(1);
        await next.click();
      }
      await noSideScroll(page);
    });
  }
});
