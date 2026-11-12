// DEVELOPMENT SPOILERS: drives the whole case in a phone-sized Chromium.
// Usage: node tests/playthrough.cjs [screenshotDir]
// Requires Playwright (preinstalled in the dev container) and Python 3.
const { chromium, devices } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/development-spoilers/v2/case-source.json'), 'utf8'));
const shots = process.argv[2];
const PORT = 8000 + Math.floor(Math.random() * 900);
const BASE = process.env.BASE_URL || `http://localhost:${PORT}/`;

async function solve(page, pid, { wrongFirst = false } = {}) {
  const p = source.puzzles[pid];
  const answer = p.answers[0];
  const check = () => page.getByRole('button', { name: /^(Check answer|Submit finding…)$/ }).click();
  switch (p.input.type) {
    case 'keyword':
      if (wrongFirst) {
        await page.fill(`#in-${pid}`, 'Mount Tabor'); await check();
        await page.getByText('Close. Helen said one word.').waitFor();
      }
      await page.fill(`#in-${pid}`, answer);
      assert.match(await page.locator('.decoded').innerText(), /THE LETTER IS A LIE/);
      await check(); break;
    case 'text':
      if (wrongFirst) { await page.fill(`#in-${pid}`, '1849'); await check(); await page.getByText('That’s the date the letter claims').waitFor(); }
      await page.fill(`#in-${pid}`, answer); await check(); break;
    case 'choice': {
      const label = p.input.options.find(o => o.id === answer).label;
      if (wrongFirst) { await page.locator('.choice', { hasText: p.input.options.find(o => o.id !== answer).label }).click(); await check(); await page.locator('.feedback.miss').waitFor(); }
      await page.locator('.choice', { hasText: label }).click(); await check(); break;
    }
    case 'multi':
      if (wrongFirst) { await page.locator('.choice', { hasText: 'Iris Calloway' }).click(); await check(); await page.getByText('Not only her').waitFor(); await page.locator('.choice', { hasText: 'Iris Calloway' }).click(); }
      for (const id of answer.split(',')) await page.locator('.choice', { hasText: p.input.options.find(o => o.id === id).label }).click();
      await check(); break;
    case 'final': {
      if (wrongFirst) { await page.locator('.choice', { hasText: 'Victor Hale' }).click(); await check(); await page.getByRole('button', { name: 'Submit finding', exact: true }).click(); await page.locator('.feedback.miss').waitFor(); }
      await page.locator('.choice', { hasText: p.input.options.find(o => o.id === answer).label }).click();
      await check(); await page.getByRole('button', { name: 'Submit finding', exact: true }).click(); break;
    }
    case 'order':
      if (wrongFirst) {
        for (const id of [...answer.split(',')].reverse()) await page.locator('.pool .card-btn', { hasText: p.input.items.find(i => i.id === id).x }).click();
        await check(); await page.locator('.feedback.miss').waitFor(); await page.getByRole('button', { name: 'Clear' }).click();
      }
      for (const id of answer.split(',')) await page.locator('.pool .card-btn', { hasText: p.input.items.find(i => i.id === id).x }).click();
      await check(); break;
    case 'strips':
      for (const id of answer.split(',')) await page.locator('.pool .strip', { hasText: p.input.items.find(i => i.id === id).x }).click();
      await check(); break;
    case 'classify':
      if (wrongFirst) { await check(); await page.getByText('Choose an answer for every line first.').waitFor(); }
      for (const pair of answer.split(',')) {
        const [item, opt] = pair.split(':');
        const label = p.input.options.find(o => o.id === opt).label;
        await page.getByRole('radiogroup', { name: `Line ${item.toUpperCase()}` }).getByRole('radio', { name: label, exact: true }).click();
      }
      await check(); break;
  }
  await page.locator('.solved .stamp').waitFor();
}

(async () => {
  const server = process.env.BASE_URL ? null : spawn('python3', ['-m', 'http.server', String(PORT), '--directory', path.join(ROOT, 'site')], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, colorScheme: scheme });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`${scheme}: ${e.message}`));
      page.on('console', m => { if (m.type() === 'error') errors.push(`${scheme}: ${m.text()}`); });
      const snap = async name => { if (shots) await page.screenshot({ path: path.join(shots, `${scheme}-${name}.png`), fullPage: true }); };
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Open the case' }).waitFor();
      // offline download in the browser context
      await page.getByRole('button', { name: 'Download for offline play' }).click();
      await page.getByRole('heading', { name: 'Ready offline', exact: true }).waitFor({ timeout: 30000 });
      await snap('00-prep');
      await page.getByRole('button', { name: 'Open the case' }).click();
      const order = source.chapters.flatMap(c => c.puzzles);
      let n = 0;
      for (const chapter of source.chapters) {
        await page.locator('.chapter-title', { hasText: chapter.title }).waitFor();
        await snap(`c${chapter.number}-intro`);
        await page.locator('.intro .btn.primary').click();
        for (const pid of chapter.puzzles) {
          n++;
          await page.locator('h1', { hasText: source.puzzles[pid].title }).waitFor();
          // no future content leaks onto the page
          const text = await page.locator('main').innerText();
          for (const later of order.slice(n)) assert(!text.includes(source.puzzles[later].title), `${pid} shows later puzzle ${later}`);
          assert(!text.includes(source.ending.headline), `${pid} shows the ending`);
          await snap(`p${n}-${pid}`);
          if (pid === 'P3') { // backup reference path
            await page.getByRole('button', { name: 'Can’t access this clue' }).click();
            await page.locator('#ev-E10[open]').waitFor();
          }
          if (pid === 'P4') { // reveal path
            await page.getByRole('button', { name: 'Show hint 1 of 3' }).click();
            await page.getByText('Hint 1').waitFor();
            await page.getByRole('button', { name: 'Reveal answer…' }).click();
            await page.getByRole('button', { name: 'Reveal', exact: true }).click();
            await page.locator('.solved.revealed').waitFor();
          } else {
            await solve(page, pid, { wrongFirst: scheme === 'light' });
          }
          await snap(`p${n}-${pid}-done`);
          if (pid === 'P5') { // persistence across reload
            await page.reload();
            await page.locator('.solved .stamp').waitFor();
          }
          await page.locator('.solved .btn.primary').click();
        }
      }
      await page.getByRole('heading', { name: source.ending.headline }).waitFor();
      await page.getByText('Read the full case explanation').click();
      await snap('99-ending');
      await page.getByRole('button', { name: 'File', exact: true }).click();
      await page.getByRole('heading', { name: 'Case file' }).waitFor();
      await snap('98-file');
      // restart
      await page.getByRole('button', { name: 'Setup', exact: true }).click();
      await page.getByText('Restart', { exact: true }).click();
      await page.getByRole('button', { name: 'Restart the investigation…' }).click();
      await page.getByRole('button', { name: 'Erase and restart' }).click();
      await page.getByRole('button', { name: 'Open the case' }).waitFor();
      // offline relaunch: content served from the verified package
      await ctx.setOffline(true);
      await page.reload();
      await page.getByRole('button', { name: 'Open the case' }).waitFor();
      await page.getByRole('heading', { name: 'Ready offline', exact: true }).waitFor({ timeout: 30000 });
      await ctx.close();
      console.log(`PASS ${scheme}: ${n} puzzles, ending, file, restart, offline relaunch`);
    }
    assert.deepStrictEqual(errors, [], 'browser errors');
  } finally {
    await browser.close(); server?.kill();
  }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
