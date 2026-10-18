// @ts-check
// Checks every tab of the trainer page without knowing what the tabs are.
// It relies on the conventions every drill follows today:
//   - tabs are [role=tab] buttons whose aria-controls names their [role=tabpanel];
//   - answer buttons carry a <kbd> shortcut and are disabled once you answer;
//   - the "next" button that appears after an answer carries <kbd>N</kbd>.
// A new drill that keeps these conventions is covered without editing this file.
// A tab that isn't a drill (its panel carries data-tool, like the session log) gets its own test.
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
      // A panel may host another tab's drill inside it (the Daily tab does), and then that drill is part of it.
      const hosted = await page.locator(`#${panelId} #${other.panelId}`).count();
      if (other.panelId === panelId || hosted) await expect(panel).toBeVisible();
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
  const drills = names.filter(id => !new RegExp(`id="${id}"[^>]*\\sdata-tool`).test(html));

  test('the page file has tabs to drill', async ({ page }) => {
    expect(drills.length).toBeGreaterThan(0);
    expect(names.length, 'the regex finds every tab the browser sees').toBe(await page.getByRole('tab').count());
  });

  for (const panelId of drills) {
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

test('the daily set plays in its own tab and starts a streak', async ({ page }) => {
  await page.locator('[role=tab][aria-controls="view-daily"]').click();
  const panel = page.locator('#view-daily');
  const daily = page.locator('#dy');
  const nKey = page.locator('kbd', { hasText: /^N$/ });
  const next = panel.locator('button:visible:has(kbd)').filter({ has: nKey });
  const open = panel.locator('button:visible:has(kbd)').filter({ hasNot: nKey }).and(page.locator(':enabled'));
  // Answer whatever the set asks until it says it is done. A full hand has several decisions.
  for (let step = 0; step < 60 && !(await daily.textContent() || '').includes('is done'); step++) {
    await expect(page.getByRole('tab', { selected: true }), 'the set stays in the Daily tab').toHaveAttribute('aria-controls', 'view-daily');
    if (await next.count()) { await next.click(); continue; }
    await expect(open.first()).toBeVisible();
    await open.first().click();
  }
  await expect(daily).toContainText('Today’s set is done');
  await expect(daily.locator('.dy-streak b')).toHaveText('1');
  await expect(daily.locator('.dy-dots li.ok, .dy-dots li.bad')).toHaveCount(9);
  await next.click();
  await expect(panel.locator('.eyebrow:visible', { hasText: 'Extra question' })).toHaveCount(1);
  await page.reload();
  await expect(daily).toContainText('Today’s set is done');
  await noSideScroll(page);
});

/** Answers one seat question and returns the Seats tile's "x of y right" text. @param {import('@playwright/test').Page} page */
async function answerOneSeat(page) {
  await page.locator('[role=tab][aria-controls="view-seats"]').click();
  await page.locator('#view-seats button:visible:has(kbd)').first().click();
  return (await page.locator('.rv-tile', { hasText: 'Seats' }).locator('.rv-sub').first().textContent() || '').trim();
}

test('progress moves to another device with a code', async ({ page }) => {
  const record = await answerOneSeat(page);
  expect(record).toMatch(/of 1 right/);
  await page.locator('#sv summary').click();
  await page.locator('#sv-copy').click();
  const code = page.locator('#sv-code');
  await expect(code).toBeVisible();
  const text = await code.inputValue();
  expect(text).toMatch(/^PT1z?\./);

  // A fresh device: nothing saved, then the code pasted with some chat text around it.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.rv-tile', { hasText: 'Seats' })).toContainText('Not started');
  await page.locator('#sv summary').click();
  await page.locator('#sv-in').fill('nonsense');
  await page.locator('#sv-load').click();
  await expect(page.locator('#sv-ask')).toContainText('isn’t a PokerTrainer save');
  await page.locator('#sv-in').fill(`here's my save:\n${text}\n`);
  await page.locator('#sv-load').click();
  await expect(page.locator('#sv-ask')).toContainText('1 answer');
  await page.locator('#sv-yes').click();
  await expect(page.locator('#sv-ask')).toContainText('Your save is loaded');
  await expect(page.locator('.rv-tile', { hasText: 'Seats' })).toContainText(record);
  await noSideScroll(page);
});

test('progress moves to another device with a file', async ({ page }) => {
  const record = await answerOneSeat(page);
  await page.locator('#sv summary').click();
  const download = page.waitForEvent('download');
  await page.locator('#sv-file').click();
  const file = await (await download).path();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#sv summary').click();
  await page.locator('#sv-input').setInputFiles(file);
  await expect(page.locator('#sv-ask')).toContainText('replaces the progress on this device (0 answers)');
  await page.locator('#sv-no').click();
  await expect(page.locator('#sv-ask')).toBeEmpty();
  await page.locator('#sv-input').setInputFiles(file);
  await page.locator('#sv-yes').click();
  await expect(page.locator('.rv-tile', { hasText: 'Seats' })).toContainText(record);
});

test('friends share their stats with a code or a link', async ({ page }) => {
  await answerOneSeat(page);
  const panel = page.locator('#fr');
  await panel.locator('summary').click();
  const mine = (await panel.locator('.fr-card.me .fr-drills').textContent() || '').trim();
  expect(mine).toMatch(/^1 answer · Seats (0|100)%$/);
  await page.locator('#fr-copy').click();
  await expect(page.locator('#fr-out')).toContainText('Add your name first');
  await page.locator('#fr-me').fill('Ada');
  await page.locator('#fr-copy').click();
  const text = await page.locator('#fr-code').inputValue();
  const code = (/PF1\.[A-Za-z0-9_-]+/.exec(text) || [''])[0];
  expect(text).toContain('#friend=PF1.');
  await page.locator('#fr-in').fill(text);
  await page.locator('#fr-add').click();
  await expect(page.locator('#fr-msg')).toContainText('your own code');

  // A friend on another device opens the link.
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${PAGE_URL}#friend=${code}`);
  await page.reload();
  const card = page.locator('.fr-card:not(.me)');
  await expect(page.locator('#fr-msg')).toContainText('Added Ada');
  await expect(card).toContainText('Ada');
  await expect(card).toContainText('Shared today');
  await expect(card.locator('.fr-drills')).toHaveText(mine);
  expect(page.url()).not.toContain('friend=');
  await noSideScroll(page);
  await card.getByRole('button', { name: 'Remove' }).click();
  await card.getByRole('button', { name: 'Click again to remove' }).click();
  await expect(card).toHaveCount(0);

  // Or pastes the code with some chat text around it; a second paste updates rather than adds.
  await page.locator('#fr-in').fill('nonsense');
  await page.locator('#fr-add').click();
  await expect(page.locator('#fr-msg')).toContainText('isn’t a friend code');
  await page.locator('#fr-in').fill(`hey, ${text} see you`);
  await page.locator('#fr-add').click();
  await expect(page.locator('#fr-msg')).toContainText('Added Ada');
  await page.locator('#fr-in').fill(text);
  await page.locator('#fr-add').click();
  await expect(page.locator('#fr-msg')).toContainText('Updated Ada');
  await expect(card).toHaveCount(1);
  await page.reload();
  await page.locator('#fr summary').click();
  await expect(card).toContainText('Ada');
});

test('the session log adds, edits and deletes sessions and counts the bankroll', async ({ page }) => {
  await page.locator('[role=tab][aria-controls="view-log"]').click();
  const panel = page.locator('#view-log');
  await expect(panel.locator('.lg-empty')).toBeVisible();

  // A missing amount is caught before saving.
  await page.locator('#lg-stakes').fill('1/2 live');
  await page.locator('#lg-hours').fill('3');
  await page.locator('#lg-in').fill('400');
  await page.locator('#lg-save').click();
  await expect(page.locator('#lg-msg')).toContainText('cashed out');
  await expect(page.locator('#lg-out')).toHaveAttribute('aria-invalid', 'true');

  await page.locator('#lg-out').fill('1 000');
  await expect(page.locator('#lg-preview')).toContainText('+600 kr');
  await page.locator('#lg-save').click();
  await expect(page.locator('#lg-msg')).toContainText('Session saved');
  await expect(page.locator('#lgst-n')).toHaveText('1');
  await expect(page.locator('#lgst-res')).toHaveText('+600 kr');
  await expect(page.locator('#lgst-hr')).toHaveText('+200 kr');

  // A losing session at other stakes, with the hours as h:mm and a decimal comma.
  await page.locator('#lg-stakes').fill('2/4 live');
  await page.locator('#lg-hours').fill('1:30');
  await page.locator('#lg-in').fill('800');
  await page.locator('#lg-out').fill('500,5');
  await page.locator('#lg-save').click();
  await expect(page.locator('#lgst-res')).toHaveText('+301 kr');
  await expect(page.locator('#lgst-h')).toHaveText('4.5');
  await expect(page.locator('#lg-by-wrap')).toBeVisible();

  // The bankroll in buy-ins: 5,000 + 300.5 is 26.5 buy-ins of 200.
  await page.locator('#lg-start').fill('5000');
  await page.locator('#lg-game').fill('200');
  await expect(page.locator('#lg-bank')).toContainText('5,301 kr');
  await expect(page.locator('#lg-bank')).toContainText('26.5 buy-ins');
  await expect(page.locator('#lg-bank')).toContainText('aggressive');

  // Edit the losing session into a win.
  const lose = panel.locator('.lg-item', { hasText: '2/4 live' });
  await lose.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#lg-save')).toHaveText('Save changes');
  await expect(page.locator('#lg-hours')).toHaveValue('1.5');
  await page.locator('#lg-out').fill('900');
  await page.locator('#lg-save').click();
  await expect(page.locator('#lg-msg')).toContainText('Session updated');
  await expect(page.locator('#lgst-n')).toHaveText('2');
  await expect(page.locator('#lgst-res')).toHaveText('+700 kr');

  // It survives a reload, shows in another currency, and deletes with two taps.
  await page.reload();
  await expect(page.getByRole('tab', { selected: true })).toHaveAttribute('aria-controls', 'view-log');
  await expect(page.locator('#lgst-res')).toHaveText('+700 kr');
  await expect(page.locator('#lg-start')).toHaveValue('5000');
  await panel.locator('[data-cur="USD"]').click();
  await expect(page.locator('#lgst-res')).toHaveText('+$70');
  await panel.locator('[data-cur="NOK"]').click();
  const del = panel.locator('.lg-item', { hasText: '2/4 live' }).getByRole('button', { name: 'Delete' });
  await del.click();
  await expect(panel.locator('.lg-item')).toHaveCount(2);
  await panel.locator('.lg-item', { hasText: '2/4 live' }).getByRole('button', { name: 'Tap again to delete' }).click();
  await expect(panel.locator('.lg-item')).toHaveCount(1);
  await expect(page.locator('#lgst-res')).toHaveText('+600 kr');
  await expect(page.locator('#lg-by-wrap')).toBeHidden();
  await noSideScroll(page);
});
