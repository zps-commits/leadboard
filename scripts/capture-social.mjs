/**
 * Captures the real screens used by the social images.
 *
 * Element captures, not viewport crops: a crop cuts a label in half and
 * omits whatever sits below the fold.
 *
 *   npm run build && npm run start -- --port 5411
 *   SHOT_URL=http://localhost:5411 npm run shots
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = (process.env.SHOT_URL ?? 'http://localhost:5411').replace(/\/$/, '');
const OUT = 'docs/social-media/assets';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

{
  const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.locator('section[aria-labelledby="figures-heading"]').screenshot({ path: `${OUT}/figures.png` });
  await page.locator('section[aria-labelledby="stages-heading"]').screenshot({ path: `${OUT}/stages.png` });
  await page.locator('section[aria-labelledby="cold-heading"]').screenshot({ path: `${OUT}/cold.png` });

  await page.goto(`${BASE}/pipeline`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.locator('section[aria-labelledby="column-proposal"]').screenshot({ path: `${OUT}/column.png` });
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 414, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${BASE}/pipeline`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/phone.png` });
  await context.close();
}

await browser.close();
console.log(`Captured into ${OUT}`);
