// ヘッドレスChromium (Playwright) で scene.html をレンダリングしてPNG保存
// 使い方: node render.mjs [shot ...]   (無指定 = 納品4ショット)
//   node render.mjs expressions        ← 表情8枚 (assets/char-ref/expressions/)
//   node render.mjs cuts               ← cat-ckd の7カット構図 (content/2026-07-22_cat-ckd/)
//   node render.mjs cut-05 expr_neko_doya   ← 個別
//   node render.mjs neko_yaw_0 neko_yaw_90  ← デバッグターンテーブル
// 環境変数 OUT_OVERRIDE=<dir> で納品4ショットの出力先を差し替え（GO済み正本を壊さず検証したいとき）
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const PLAYWRIGHT = '/opt/node22/lib/node_modules/playwright/index.mjs';
const CHROMIUM = '/opt/pw-browsers/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT_OVERRIDE
  ? path.resolve(process.env.OUT_OVERRIDE)
  : path.resolve(here, '../../assets/char-ref');
const EXPR_OUT = path.resolve(here, '../../assets/char-ref/expressions');
const CUT_OUT = path.resolve(here, '../../content/2026-07-22_cat-ckd');
const DEBUG_OUT = path.resolve(here, 'debug');

// 納品ショット（1080x1350 / 1080x1920 を deviceScaleFactor=2 で撮影 → 2160x2700 / 2160x3840）
const DELIVERABLES = {
  hero_duo:       { w: 1080, h: 1350 },
  nekoneko_front: { w: 1080, h: 1350 },
  inuinu_front:   { w: 1080, h: 1350 },
  duo_vertical:   { w: 1080, h: 1920 },
};

// 表情バリエーション（05-visual.md 準拠）: 1080x1350 等倍
const EXPRESSIONS = {
  neko: ['nonbiri', 'doya', 'shinpai', 'yareyare'],
  inu: ['egao', 'zenryoku', 'shombori', 'hatto'],
};
const EXPR_SHOTS = Object.entries(EXPRESSIONS).flatMap(([kind, list]) =>
  list.map((e) => `expr_${kind}_${e}`)
);

// cat-ckd 7カット構図: 9:16 1080x1920 等倍・文字は焼き込まない
const CUT_SHOTS = ['cut-01', 'cut-02', 'cut-03', 'cut-04', 'cut-05', 'cut-06', 'cut-07'];

function specFor(name) {
  if (DELIVERABLES[name]) return { name, ...DELIVERABLES[name], dpr: 2, out: OUT };
  if (name.startsWith('expr_')) return { name, w: 1080, h: 1350, dpr: 1, out: EXPR_OUT, file: exprFile(name) };
  if (CUT_SHOTS.includes(name)) return { name, w: 1080, h: 1920, dpr: 1, out: CUT_OUT };
  return { name, w: 1080, h: 1350, dpr: 1, out: DEBUG_OUT };
}
// expr_neko_doya -> neko_doya.png
function exprFile(name) { return name.replace(/^expr_/, '') + '.png'; }

const argShots = process.argv.slice(2);
const expanded = argShots.flatMap((a) =>
  a === 'expressions' ? EXPR_SHOTS : a === 'cuts' ? CUT_SHOTS : a === 'deliverables' ? Object.keys(DELIVERABLES) : [a]
);
const shots = (expanded.length ? expanded : Object.keys(DELIVERABLES)).map(specFor);

const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch({
  executablePath: CHROMIUM,
  args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});

for (const s of shots) {
  fs.mkdirSync(s.out, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: s.dpr,
  });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  const url = 'file://' + path.join(here, 'scene.html') + `?shot=${s.name}`;
  // 大きいバッファ（2160x3840等）はページ初期化が30秒を超えることがある → 明示的に延長
  await page.goto(url, { timeout: 300000 });
  // ★ waitForFunction の第2引数は arg。options は第3引数に渡さないと既定30秒のままになる
  //   （2160x3840 の duo_vertical はソフトウェアGLで30秒を超えるため実際にタイムアウトしていた）
  await page.waitForFunction(() => window.__done === true || window.__err, null, { timeout: 300000 });
  const err = await page.evaluate(() => window.__err);
  if (err) {
    console.error(`✗ ${s.name}: ${err}`);
    await page.close();
    continue;
  }
  const file = path.join(s.out, s.file || `${s.name}.png`);
  await page.screenshot({ path: file });
  console.log(`✓ ${s.name} -> ${file}`);
  await page.close();
}

await browser.close();
