// ヘッドレスChromium (Playwright) で scene.html をレンダリングしてPNG保存
// 使い方: node render.mjs [shot ...]   (無指定 = 納品4ショット)
//   例: node render.mjs neko_yaw_0 neko_yaw_90   ← デバッグターンテーブル
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const PLAYWRIGHT = '/opt/node22/lib/node_modules/playwright/index.mjs';
const CHROMIUM = '/opt/pw-browsers/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../../assets/char-ref');
const DEBUG_OUT = path.resolve(here, 'debug');

// 納品ショット（1080x1350 / 1080x1920 を deviceScaleFactor=2 で撮影 → 2160x2700 / 2160x3840）
const DELIVERABLES = {
  hero_duo:       { w: 1080, h: 1350 },
  nekoneko_front: { w: 1080, h: 1350 },
  inuinu_front:   { w: 1080, h: 1350 },
  duo_vertical:   { w: 1080, h: 1920 },
};

const argShots = process.argv.slice(2);
const shots = argShots.length
  ? argShots.map((n) => ({ name: n, ...(DELIVERABLES[n] || { w: 1080, h: 1350, debug: !DELIVERABLES[n] }) }))
  : Object.entries(DELIVERABLES).map(([name, s]) => ({ name, ...s }));

const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch({
  executablePath: CHROMIUM,
  args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(DEBUG_OUT, { recursive: true });

for (const s of shots) {
  const page = await browser.newPage({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 2,
  });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  const url = 'file://' + path.join(here, 'scene.html') + `?shot=${s.name}`;
  await page.goto(url);
  await page.waitForFunction(() => window.__done === true || window.__err, { timeout: 90000 });
  const err = await page.evaluate(() => window.__err);
  if (err) {
    console.error(`✗ ${s.name}: ${err}`);
    await page.close();
    continue;
  }
  const file = path.join(s.debug ? DEBUG_OUT : OUT, `${s.name}.png`);
  await page.screenshot({ path: file });
  console.log(`✓ ${s.name} -> ${file}`);
  await page.close();
}

await browser.close();
