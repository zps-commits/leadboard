/**
 * Builds the social images.
 *
 * Real captures, placed whole inside a layout rendered by the browser.
 * No generative model touches a screenshot: it redraws what it is shown,
 * and what these screens say is the point.
 *
 * One rule on every slide: the screen appears WHOLE. Nothing is cropped
 * and nothing bleeds off an edge.
 *
 *   npm run social   → docs/social-media/composed/*.png at 1080x1350
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const OUT = 'docs/social-media/composed';
const SHOTS = '../assets';

/* The application's own tokens. */
const T = {
  paper: '#f5f4f1',
  surface: '#ffffff',
  line: '#dcdad4',
  ink: '#1b1d1c',
  muted: '#5c615e',
  won: '#15603c',
  proposal: '#855305',
  negotiation: '#6a3fa0',
};

/* The app loads Geist through next/font; the composition loads the same
   face from a package, so the images and the product match. */
const FONT = `
  @font-face {
    font-family: 'Geist';
    src: url('../../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2') format('woff2');
    font-weight: 100 900;
  }
`;

const BASE = `
  ${FONT}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px; overflow: hidden;
    font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
    background: ${T.paper}; color: ${T.ink};
    -webkit-font-smoothing: antialiased;
  }
  .frame { width: 1080px; height: 1350px; display: flex; flex-direction: column; }
  .pad { padding: 84px 84px 0; }
  .eyebrow {
    font-family: ui-monospace, monospace; font-size: 20px; letter-spacing: .14em;
    text-transform: uppercase; color: ${T.muted};
  }
  h1 { font-size: 92px; line-height: .98; letter-spacing: -.035em; font-weight: 600; }
  h2 { font-size: 60px; line-height: 1.06; letter-spacing: -.03em; font-weight: 600; }
  .lede { font-size: 33px; line-height: 1.32; color: ${T.muted}; }
  .shot { display: block; width: 100%; }
  .shot-wrap {
    border-radius: 14px; overflow: hidden; border: 1px solid ${T.line};
    box-shadow: 0 30px 70px -40px rgba(27,29,28,.5); background: ${T.surface};
  }
  .foot {
    margin-top: auto; padding: 0 84px 72px; display: flex; justify-content: space-between;
    align-items: baseline; font-family: ui-monospace, monospace; font-size: 20px; color: ${T.muted};
  }
`;

const SLIDES = [
  {
    name: '1-cover',
    html: `
      <div class="frame" style="flex-direction:row; align-items:center; gap:56px; padding:0 84px">
        <div style="flex:1 1 0; min-width:0">
          <div class="eyebrow">Small CRM</div>
          <h1 style="margin-top:22px">LeadBoard</h1>
          <p class="lede" style="margin-top:28px; max-width:17ch">
            A sales pipeline that tells you where your data actually lives.
          </p>
          <div style="margin-top:40px; font-family:ui-monospace,monospace; font-size:20px; color:${T.ink}">
            07-leadboard.vercel.app
          </div>
        </div>
        <div class="shot-wrap" style="flex:0 0 400px">
          <img class="shot" src="${SHOTS}/phone.png" alt="">
        </div>
      </div>`,
  },
  {
    name: '2-problem',
    html: `
      <div class="frame" style="justify-content:center; padding:0 84px">
        <div class="eyebrow">The conflict in the brief</div>
        <h2 style="margin-top:22px; max-width:16ch">A SQLite file on a serverless host is not storage</h2>
        <div style="margin-top:52px; display:grid; gap:22px">
          <div style="background:${T.surface}; border:1px solid ${T.line}; border-radius:16px; padding:36px 40px">
            <div class="eyebrow" style="color:${T.proposal}">What happens</div>
            <p style="margin-top:12px; font-size:30px; line-height:1.34">
              The instance that wrote the file may not exist for the next
              request. The lead is simply not there any more.
            </p>
          </div>
          <div style="background:${T.surface}; border:1px solid ${T.line}; border-radius:16px; padding:36px 40px">
            <div class="eyebrow" style="color:${T.proposal}">What does not happen</div>
            <p style="margin-top:12px; font-size:30px; line-height:1.34">
              Nothing errors. Nothing warns. The loss is silent.
            </p>
          </div>
        </div>
        <p style="margin-top:44px; font-size:28px; line-height:1.4; color:${T.muted}; max-width:34ch">
          A CRM that loses a lead without saying so is worse than no CRM.
        </p>
      </div>`,
  },
  {
    name: '3-solution',
    html: `
      <div class="frame">
        <div class="pad">
          <div class="eyebrow">What was built instead</div>
          <h2 style="margin-top:22px">One interface,<br>three stores, one contract</h2>
          <p style="margin-top:26px; font-size:27px; line-height:1.4; color:${T.muted}; max-width:38ch">
            SQLite locally, the visitor's own browser in the hosted
            demonstration, memory in the tests — and the same sixteen tests
            run against all three.
          </p>
        </div>
        <div style="padding:36px 84px 0">
          <div class="shot-wrap"><img class="shot" src="${SHOTS}/figures.png" alt=""></div>
        </div>
        <div style="padding:30px 84px 0; display:flex; gap:26px; align-items:flex-start">
          <div class="shot-wrap" style="flex:1 1 0; min-width:0"><img class="shot" src="${SHOTS}/stages.png" alt=""></div>
          <div class="shot-wrap" style="flex:0 0 300px"><img class="shot" src="${SHOTS}/column.png" alt=""></div>
        </div>
        <div class="foot"><span>Every figure is counted from the leads themselves</span></div>
      </div>`,
  },
  {
    name: '4-build',
    html: `
      <div class="frame" style="background:${T.ink}; color:${T.paper}">
        <div class="pad">
          <div class="eyebrow" style="color:#9ba09c">The build</div>
          <h2 style="margin-top:22px; color:${T.paper}">Next.js 16 · React 19<br>TypeScript · Drizzle</h2>
          <p style="margin-top:30px; font-size:26px; line-height:1.44; color:#b4b9b5; max-width:34ch">
            Money as integer cents in a column with a check constraint.
            Stage, source and activity kind carry check constraints too: a
            TypeScript enum does not stop a hand-typed INSERT.
          </p>
          <p style="margin-top:24px; font-size:26px; line-height:1.44; color:#b4b9b5; max-width:34ch">
            <strong style="color:${T.paper}">Drag and drop is the shortcut, not the mechanism.</strong>
            Every card carries a visible stage menu, and each move is
            announced in a live region.
          </p>
        </div>
        <div style="margin-top:auto; padding:0 84px">
          <div style="background:#2a2e2b; border:1px solid #3a3f3b; border-radius:14px; padding:34px 40px">
            <pre style="font-family:ui-monospace,monospace; font-size:21px; line-height:1.66; color:#d6dad7; white-space:pre"><span style="color:#8b918c">// The phone scrolled 800px sideways into blank</span>
<span style="color:#8b918c">// paper: hidden labels are absolutely positioned</span>
<span style="color:#8b918c">// and escaped the scroller they were inside.</span>
className=<span style="color:#9fd8b6">"card relative p-3"</span></pre>
          </div>
        </div>
        <div class="foot" style="color:#9ba09c">
          <span>97 tests · 0 axe violations, 5 routes, 4 widths</span>
          <span>07-leadboard.vercel.app</span>
        </div>
      </div>`,
  },
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });

for (const slide of SLIDES) {
  // Loaded over file://, not set as content: the captures are referenced
  // by relative path and setContent leaves the page no base URL to
  // resolve them against, so they would silently vanish.
  const file = `${OUT}/${slide.name}.html`;
  await writeFile(file, `<meta charset="utf-8"><style>${BASE}</style>${slide.html}`);
  await page.goto(`file://${process.cwd()}/${file}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/${slide.name}.png` });
  await rm(file);
  console.log(`${OUT}/${slide.name}.png`);
}

await browser.close();
