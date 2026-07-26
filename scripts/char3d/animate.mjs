// カットを「実際に動く mp4」として書き出す（Three.js シーンを自前でアニメーション）
//
// 使い方:
//   node animate.mjs                 # 全7カット → content/2026-07-22_cat-ckd/cut-0N.mp4
//   node animate.mjs cut-01          # 個別
//   node animate.mjs cut-01 cut-07   # 複数
//
// 環境変数:
//   FPS=30            フレームレート（既定 30）
//   CONCURRENCY=2     同時にレンダリングするカット数（既定 2 / 4コア想定）
//   OUT_DIR=<dir>     mp4 の出力先（既定 content/2026-07-22_cat-ckd）
//   KEEP_FRAMES=1     中間PNG（.render/）を消さずに残す
//
// 仕組み: rAF に任せず「時刻 t を渡して1フレーム同期描画 → screenshot」を繰り返す。
//         同じ t は常に同じ絵＝決定論的で再現可能。全カットはループ可能に作ってあるので、
//         音声長に合わせて ffmpeg 側でループ延長できる（-stream_loop / loop フィルタ）。
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const FFMPEG = require('@ffmpeg-installer/ffmpeg').path;

const PLAYWRIGHT = '/opt/node22/lib/node_modules/playwright/index.mjs';
const CHROMIUM = '/opt/pw-browsers/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : path.resolve(here, '../../content/2026-07-22_cat-ckd');
const FRAME_ROOT = path.resolve(here, '.render');

const W = 1080, H = 1920;                      // 9:16
const FPS = Number(process.env.FPS) || 30;
const CONCURRENCY = Number(process.env.CONCURRENCY) || 2;
const KEEP_FRAMES = process.env.KEEP_FRAMES === '1';

const ALL_CUTS = ['cut-01', 'cut-02', 'cut-03', 'cut-04', 'cut-05', 'cut-06', 'cut-07'];
const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const cuts = args.length ? args : ALL_CUTS;

const sh = (cmd, cmdArgs) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? res(err) : rej(new Error(`${path.basename(cmd)} exit ${code}\n${err.slice(-2500)}`))));
  });

const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch({
  executablePath: CHROMIUM,
  args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});

/** 1カット: フレーム連番を撮って mp4 にエンコード */
async function renderCut(name) {
  const t0 = Date.now();
  const frameDir = path.join(FRAME_ROOT, name);
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.error(`[${name}]`, m.text()); });

  const url = `file://${path.join(here, 'anim.html')}?anim=1&shot=${name}&fps=${FPS}`;
  await page.goto(url, { timeout: 300000 });
  // ★ waitForFunction の options は第3引数（第2引数は arg）。既定30秒だとセットアップが間に合わない
  await page.waitForFunction(() => window.__animReady === true || window.__err, null, { timeout: 600000 });
  const err = await page.evaluate(() => window.__err);
  if (err) { await page.close(); throw new Error(`${name}: ${err}`); }

  const meta = await page.evaluate(() => window.__animMeta);
  const total = meta.frames;
  console.log(`▶ ${name}: ${meta.duration}s × ${FPS}fps = ${total} frames (setup ${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  const tFrames = Date.now();
  for (let i = 0; i < total; i++) {
    // ★ 最終フレームは i=total-1 まで（i=total は u=0 と同じ絵＝ループ時に重複するので撮らない）
    await page.evaluate((t) => window.__renderFrame(t), i / FPS);
    await page.screenshot({ path: path.join(frameDir, `f${String(i).padStart(5, '0')}.png`) });
  }
  await page.close();
  const secPerFrame = (Date.now() - tFrames) / 1000 / total;

  const outFile = path.join(OUT_DIR, `${name}.mp4`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await sh(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', path.join(frameDir, 'f%05d.png'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '4.0',
    '-movflags', '+faststart',
    '-r', String(FPS),
    outFile,
  ]);
  if (!KEEP_FRAMES) fs.rmSync(frameDir, { recursive: true, force: true });

  const mb = (fs.statSync(outFile).size / 1048576).toFixed(2);
  console.log(`✓ ${name} -> ${outFile}  (${meta.duration}s / ${mb}MB / ${secPerFrame.toFixed(2)}s per frame / total ${((Date.now() - t0) / 1000 / 60).toFixed(1)}min)`);
}

// 4コアなので少数並列（SwiftShader はCPU描画）
const queue = [...cuts];
const failures = [];
async function worker() {
  while (queue.length) {
    const name = queue.shift();
    try { await renderCut(name); }
    catch (e) { failures.push(name); console.error(`✗ ${name}: ${e.message}`); }
  }
}
const started = Date.now();
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, cuts.length) }, worker));
await browser.close();

console.log(`\n全体 ${((Date.now() - started) / 1000 / 60).toFixed(1)}min / 成功 ${cuts.length - failures.length}/${cuts.length}`);
if (failures.length) { console.error('失敗:', failures.join(', ')); process.exit(1); }
