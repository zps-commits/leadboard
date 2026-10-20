/**
 * Browser verification, committed so anyone can re-run it.
 *
 * Unit tests cannot see a control with no accessible name, a page
 * wider than the phone it is on, or a drag that does not drop. This
 * drives the built app in a real browser at four widths across every
 * route and fails the command if anything is wrong.
 *
 *   npm run build && npm run start -- --port 5411
 *   VERIFY_URL=http://localhost:5411 npm run verify:ui
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = (process.env.VERIFY_URL ?? 'http://localhost:5411').replace(/\/$/, '');
const ROUTES = ['/', '/leads', '/pipeline', '/activity', '/settings'];
const WIDTHS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'small phone', width: 320, height: 720 },
];

const failures = [];
const note = (message) => console.log(`  ${message}`);

async function axeOn(page, label) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  if (violations.length === 0) return true;
  for (const violation of violations) {
    failures.push(
      `[${label}] ${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
        .map((node) => node.target.join(' '))
        .slice(0, 3)
        .join('; ')}`,
    );
  }
  return false;
}

async function overflowOn(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) failures.push(`[${label}] the page scrolls ${overflow}px sideways`);
  return overflow === 0;
}

const browser = await chromium.launch();

for (const size of WIDTHS) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404')) {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  console.log(`\n${size.name} (${size.width}px)`);
  for (const route of ROUTES) {
    const label = `${size.name} ${route}`;
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
    // The store loads in the browser, so wait for the page to settle.
    await page.waitForTimeout(700);
    const clean = (await axeOn(page, label)) && (await overflowOn(page, label));
    note(`${route}${clean ? '' : '  <- problem'}`);
  }

  if (consoleErrors.length > 0) {
    failures.push(`[${size.name}] console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  } else {
    note('no console errors');
  }
  await context.close();
}

// One pass over the things a person actually does.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  console.log('\ninteractions (1440px)');

  await page.goto(`${BASE}/leads`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const name = `Verification ${Date.now()}`;
  await page.getByRole('button', { name: 'Add a lead' }).first().click();
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Estimated value').fill('1.234,56');
  await page.getByRole('button', { name: 'Add the lead' }).click();
  await page.getByRole('row', { name: new RegExp(name) }).waitFor();
  note('a lead can be created, and the European amount is read correctly');

  const row = await page.getByRole('row', { name: new RegExp(name) }).textContent();
  if (!row?.includes('1.234,56')) failures.push(`[interactions] the amount came back as ${row}`);

  // Search, then clear it again.
  await page.getByRole('searchbox', { name: 'Search' }).fill(name);
  await page.waitForTimeout(300);
  if ((await page.locator('tbody tr').count()) !== 1) {
    failures.push('[interactions] search did not narrow the table to one row');
  } else {
    note('search narrows the table');
  }
  await page.getByRole('searchbox', { name: 'Search' }).fill('');

  // A real drag on the board, not the menu that stands in for it.
  await page.goto(`${BASE}/pipeline`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const card = page.locator('li').filter({ hasText: name }).first();
  const target = page.locator('section[aria-labelledby="column-negotiation"]');
  await card.dragTo(target);
  await page.waitForTimeout(900);
  if ((await target.locator('li').filter({ hasText: name }).count()) === 0) {
    failures.push('[interactions] dragging a card between columns did not move it');
  } else {
    note('a card can be dragged between columns');
  }

  // The export, downloaded and read.
  await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export \d+ leads/ }).click(),
  ]);
  const file = await download.createReadStream();
  const chunks = [];
  for await (const chunk of file) chunks.push(chunk);
  const csv = Buffer.concat(chunks).toString('utf8');
  if (!csv.startsWith('﻿') || !csv.includes(name)) {
    failures.push('[interactions] the export is missing its byte order mark or the new lead');
  } else {
    note('the export downloads, carries its BOM and contains the new lead');
  }

  // And remove what the run created, so the database is as it was.
  await page.goto(`${BASE}/leads`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: `Delete ${name}` }).click();
  await page.getByRole('button', { name: 'Delete the lead' }).click();
  await page.waitForTimeout(700);
  if ((await page.getByRole('row', { name: new RegExp(name) }).count()) > 0) {
    failures.push('[interactions] the lead created by this run could not be deleted');
  } else {
    note('the lead created by this run was deleted again');
  }

  await context.close();
}

await browser.close();

console.log('');
if (failures.length > 0) {
  console.error(`${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('Everything checked passed.');
