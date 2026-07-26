#!/usr/bin/env node
// compose.mjs — cut-01〜07 の素材クリップにテロップ／字幕を焼き込み、1本のリールに連結する。
//
// 使い方:
//   node scripts/compose/compose.mjs                 # 全カット合成 → cat-ckd_reel.mp4
//   node scripts/compose/compose.mjs --overlays-only # テロップPNGだけ書き出して確認
//   KEEP_WORK=1 node scripts/compose/compose.mjs     # 中間ファイル(.compose/)を残す
//
// 仕組み:
//   1) テロップ／字幕を Chromium(Playwright) で **透過PNG** としてレンダリング（Noto Sans JP を @font-face で読む）
//   2) カットごとに ffmpeg で PNG をオーバーレイ合成（各レイヤーは alpha フェードで出入り）
//      素材が台本より短いカットは -stream_loop でループ延長、長いカットは -t でトリム
//   3) 全カットを concat → 無音トラック（AAC）を付けて faststart で書き出し
//
// ⚠️ 音声は入っていない。この環境から TTS(VOICEVOX等) に到達できないため、
//    セリフ音声は後日 Mac 側で足す前提の「テロップ付き無音マスター」。README 参照。
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { CUTS, PROJECT, OUT_NAME, SPEAKERS } from './script.config.mjs';

const require = createRequire(import.meta.url);
const FFMPEG = require('@ffmpeg-installer/ffmpeg').path;
const FFPROBE = require('@ffprobe-installer/ffprobe').path;

const PLAYWRIGHT = '/opt/node22/lib/node_modules/playwright/index.mjs';
const CHROMIUM = '/opt/pw-browsers/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const SRC_DIR = path.join(REPO, 'content', PROJECT);
const WORK = path.join(here, '.compose');
const FONT_DIR = path.join(here, 'node_modules/@fontsource/noto-sans-jp/files');

const W = 1080, H = 1920, FPS = 30;
const FADE = 0.22;              // レイヤーの出入りフェード（秒）
const OVERLAYS_ONLY = process.argv.includes('--overlays-only');
const KEEP_WORK = process.env.KEEP_WORK === '1' || OVERLAYS_ONLY;

const sh = (cmd, args) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (c) => (c === 0 ? res(out) : rej(new Error(`${path.basename(cmd)} exit ${c}\n${err.slice(-3000)}`))));
  });

const probe = async (f) =>
  Number((await sh(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f])).trim());

// ───────────────────────── レイアウト（1080×1920） ─────────────────────────
// キャラクターは y≈1010-1670 に立つ。顔は y≈1080-1260。
// → メインテロップは上部の余白 (y 150-560)、字幕は足元より下 (y 1560-1830) に置く。
const CSS = `
@font-face{font-family:'NotoJP';font-style:normal;font-weight:400;src:url('file://${FONT_DIR}/noto-sans-jp-japanese-400-normal.woff2') format('woff2');}
@font-face{font-family:'NotoJP';font-style:normal;font-weight:500;src:url('file://${FONT_DIR}/noto-sans-jp-japanese-500-normal.woff2') format('woff2');}
@font-face{font-family:'NotoJP';font-style:normal;font-weight:700;src:url('file://${FONT_DIR}/noto-sans-jp-japanese-700-normal.woff2') format('woff2');}
@font-face{font-family:'NotoJPLatin';font-style:normal;font-weight:400;src:url('file://${FONT_DIR}/noto-sans-jp-latin-400-normal.woff2') format('woff2');}
@font-face{font-family:'NotoJPLatin';font-style:normal;font-weight:700;src:url('file://${FONT_DIR}/noto-sans-jp-latin-700-normal.woff2') format('woff2');}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${W}px;height:${H}px;background:transparent;}
/* ⚠️ 'Noto Color Emoji' をフォントスタックに入れないこと。
   同フォントは keycap 用に ASCII 数字を持っているため、Chromium が「3」「7」を
   絵文字グリフ（灰色・広い字送り）で描いてしまう（「この 3 つ」のように隙間が空く）。
   チェック／ピンのアイコンは絵文字ではなく SVG で描いている。 */
.stage{position:relative;width:${W}px;height:${H}px;
  font-family:'NotoJP','NotoJPLatin',sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}

/* ── 上部スタック（メインテロップ／カード → 免責 の順に縦積み） ──
   免責はここに入れることで「主張のすぐ下」かつ「下端から十分上」に自動配置される。
   ⚠️ 免責を画面下端に置かないこと: IG Reels/TikTok は下部190〜290pxが
      キャプション・いいね・プログレスバーに覆われ、実機で読めない＝打消し表示として不十分。 */
.top{position:absolute;top:150px;left:0;right:0;display:flex;flex-direction:column;
  align-items:center;padding:0 56px;gap:24px;}
.telop-panel{background:rgba(255,255,255,.95);border:4px solid rgba(232,101,26,.22);
  border-radius:38px;padding:26px 46px;box-shadow:0 16px 44px rgba(120,80,50,.20);
  font-weight:700;font-size:76px;line-height:1.32;letter-spacing:.01em;color:#2E2620;text-align:center;
  white-space:nowrap;}
.telop-panel.wrap{white-space:normal;}
.telop-panel em{font-style:normal;color:#E8651A;}

/* ── cut-05: アイコン列に合わせたチェックチップ ── */
.chip-check{position:absolute;transform:translateX(-50%);
  display:inline-flex;align-items:center;gap:12px;white-space:nowrap;
  background:rgba(255,255,255,.96);border:3px solid rgba(232,101,26,.28);border-radius:999px;
  padding:12px 26px 12px 20px;box-shadow:0 10px 26px rgba(120,80,50,.18);
  font-weight:700;font-size:42px;line-height:1;color:#2E2620;}
.ck{width:40px;height:40px;flex:0 0 auto;}

/* ── cut-07: チェックリスト再掲カード ── */
.card{width:100%;max-width:840px;
  background:rgba(255,255,255,.96);border:4px solid rgba(232,101,26,.22);border-radius:44px;
  padding:34px 44px 30px;box-shadow:0 18px 48px rgba(120,80,50,.22);}
.card h1{font-size:56px;font-weight:700;color:#E8651A;text-align:center;letter-spacing:.02em;margin-bottom:24px;}
.card .row{display:flex;align-items:center;gap:20px;font-size:52px;font-weight:700;color:#2E2620;
  padding:14px 8px;border-bottom:3px solid rgba(120,80,50,.10);}
.card .row:last-of-type{border-bottom:none;}
.card .row .ck{width:48px;height:48px;}
.card .pin{margin-top:22px;background:#FFF1E4;border-radius:26px;padding:18px 22px;
  display:flex;align-items:center;justify-content:center;gap:14px;
  font-size:40px;font-weight:700;color:#B24A10;text-align:center;}
.pin-ico{width:40px;height:40px;flex:0 0 auto;}

/* ── 下部字幕（話者チップ＋本文） ── */
.sub{position:absolute;left:56px;right:56px;bottom:var(--sub-bottom,96px);}
.chip{display:inline-flex;align-items:center;border-radius:999px;padding:9px 26px;margin-bottom:12px;
  font-size:33px;font-weight:700;letter-spacing:.06em;box-shadow:0 6px 16px rgba(60,40,25,.22);}
.chip.cat{background:#FFEFC9;color:#6E4A1E;border:3px solid rgba(110,74,30,.28);}
.chip.dog{background:#DDB889;color:#523415;border:3px solid rgba(82,52,21,.30);}
.bubble{background:rgba(38,31,26,.86);border-radius:28px;padding:22px 32px;
  font-size:47px;font-weight:500;line-height:1.44;color:#fff;text-align:center;
  text-shadow:0 2px 6px rgba(0,0,0,.35);}

/* ── 画面内免責（.top の中に流し込む＝主張のすぐ下・下端から十分上） ── */
.disclaimer{max-width:100%;text-align:center;
  background:rgba(255,255,255,.92);border:2px solid rgba(120,80,50,.16);
  border-radius:999px;padding:12px 30px;
  font-size:32px;font-weight:500;letter-spacing:.01em;color:#4A3B31;
  box-shadow:0 8px 20px rgba(120,80,50,.12);}
`;

const CHECK_SVG = `<svg class="ck" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="#E8651A"/><path d="M6.4 12.5l3.7 3.7 7.5-7.9" fill="none" stroke="#fff" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PIN_SVG = `<svg class="pin-ico" viewBox="0 0 24 24"><path d="M6 22V3.6a1.6 1.6 0 0 1 1.6-1.6h8.8A1.6 1.6 0 0 1 18 3.6V22l-6-4.4L6 22z" fill="#E8651A"/></svg>`;

const page$ = (inner) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="stage">${inner}</div></body></html>`;

// ───────────────────────── レイヤー定義 ─────────────────────────
/** 1カット分のオーバーレイ層を作る。各層 = {name, html, start, end} */
function layersFor(cut) {
  const L = [];
  const end = (v) => (v == null ? cut.dur : v);

  // 上部スタック = テロップ（またはカード）＋ 免責。カット全域で出しっぱなしなので1枚にまとめる。
  const topParts = [];
  if (cut.telop) {
    // 手動 <br> がある場合のみ折り返しを許す（意図しない改行位置を防ぐ）
    const wrap = cut.telop.includes('<br>') ? ' wrap' : '';
    topParts.push(`<div class="telop-panel${wrap}">${cut.telop}</div>`);
  }
  if (cut.card) {
    const rows = cut.card.rows.map((r) => `<div class="row">${CHECK_SVG}<span>${r}</span></div>`).join('');
    topParts.push(`<div class="card"><h1>${cut.card.heading}</h1>${rows}<div class="pin">${PIN_SVG}<span>${cut.card.pin}</span></div></div>`);
  }
  if (cut.disclaimer) topParts.push(`<div class="disclaimer">${cut.disclaimer}</div>`);
  if (topParts.length) {
    L.push({ name: 'top', html: `<div class="top">${topParts.join('')}</div>`, start: 0, end: cut.dur });
  }

  for (const [i, c] of (cut.checkChips || []).entries()) {
    L.push({
      name: `chip${i + 1}`,
      // アイコン帯（y608-960、上下にゆれる）のすぐ上のバンドに置く
      html: `<div class="chip-check" style="left:${c.cx}px;top:486px;">${CHECK_SVG}<span>${c.text}</span></div>`,
      start: c.start, end: end(c.end),
    });
  }

  for (const [i, s] of (cut.subs || []).entries()) {
    const who = SPEAKERS[s.who];
    L.push({
      name: `sub${i + 1}`,
      html: `<div class="sub"><div class="chip ${s.who}">${who.name}</div><div class="bubble">${s.text}</div></div>`,
      start: s.start, end: end(s.end),
    });
  }
  return L;
}

// ───────────────────────── 1) 透過PNG レンダリング ─────────────────────────
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch({
  executablePath: CHROMIUM,
  args: ['--allow-file-access-from-files', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[page]', e.message));

const plan = [];
for (const cut of CUTS) {
  const layers = layersFor(cut);
  for (const l of layers) {
    const file = path.join(WORK, `${cut.id}_${l.name}.png`);
    await page.setContent(page$(l.html), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // 画面外にはみ出したら自動で字を詰める（nowrap の長いテロップ対策）。
    // 最後まで収まらなければ落とす＝画面外に文字が出た動画を書き出さない。
    const fitted = await page.evaluate(({ w, h }) => {
      const shrunk = [];
      for (const el of document.querySelectorAll('.telop-panel,.chip-check,.bubble,.card,.disclaimer')) {
        const over = () => {
          const r = el.getBoundingClientRect();
          return r.left < 4 || r.right > w - 4 || r.top < 4 || r.bottom > h - 4;
        };
        let fs = parseFloat(getComputedStyle(el).fontSize);
        let n = 0;
        while (over() && n < 40) { fs -= 2; el.style.fontSize = `${fs}px`; n++; }
        if (n) shrunk.push(`自動縮小 ${el.className}→${fs}px`);
        if (over()) throw new Error(`はみ出しが解消できない: ${el.className}`);
      }
      // 免責はプラットフォームUIの被り（下部190〜290px）より上に無ければならない。
      const d = document.querySelector('.disclaimer');
      if (d) {
        const margin = h - d.getBoundingClientRect().bottom;
        if (margin < 300) throw new Error(`免責が下端から${Math.round(margin)}pxしかない（300px以上必要／IG・TikTokのUIに隠れる）`);
        shrunk.push(`免責の下端マージン ${Math.round(margin)}px`);
      }
      return shrunk;
    }, { w: W, h: H });
    if (fitted.length) console.log(`  · ${cut.id}/${l.name}: ${fitted.join(' / ')}`);
    await page.screenshot({ path: file, omitBackground: true });
    l.file = file;
  }
  plan.push({ cut, layers });
  console.log(`✓ overlay ${cut.id}: ${layers.length}層`);
}
await browser.close();

if (OVERLAYS_ONLY) {
  console.log(`\nテロップPNGのみ書き出し: ${WORK}`);
  process.exit(0);
}

// ───────────────────────── 2) カットごとに合成 ─────────────────────────
const segs = [];
for (const { cut, layers } of plan) {
  const src = path.join(SRC_DIR, `${cut.id}.mp4`);
  if (!fs.existsSync(src)) throw new Error(`素材が無い: ${src}`);
  const srcDur = await probe(src);
  const out = path.join(WORK, `seg_${cut.id}.mp4`);

  const args = ['-y', '-loglevel', 'error'];
  // 素材が台本より短ければループ延長（クリップはループ可能に作られている＝継ぎ目は自然）。
  // 等尺のときもループを付ける: そうしないと -t で最終フレームが1枚落ちて 5.97s 等になる。
  if (srcDur < cut.dur + 0.02) args.push('-stream_loop', '-1');
  args.push('-i', src);
  for (const l of layers) args.push('-loop', '1', '-framerate', String(FPS), '-t', String(cut.dur), '-i', l.file);

  const fc = [];
  let cur = '0:v';
  layers.forEach((l, i) => {
    const e = Math.min(l.end, cut.dur);
    const fades = [`fade=t=in:st=${l.start.toFixed(2)}:d=${FADE}:alpha=1`];
    if (e < cut.dur - 0.02) fades.push(`fade=t=out:st=${(e - FADE).toFixed(2)}:d=${FADE}:alpha=1`);
    fc.push(`[${i + 1}:v]format=rgba,${fades.join(',')}[l${i}]`);
    fc.push(`[${cur}][l${i}]overlay=0:0:format=auto[v${i}]`);
    cur = `v${i}`;
  });
  fc.push(`[${cur}]format=yuv420p,fps=${FPS}[vout]`);

  args.push(
    '-filter_complex', fc.join(';'),
    '-map', '[vout]', '-an',
    '-t', String(cut.dur),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-video_track_timescale', '30000',
    out,
  );
  await sh(FFMPEG, args);
  const d = await probe(out);
  console.log(`✓ ${cut.id}: 素材${srcDur.toFixed(1)}s → ${d.toFixed(2)}s（${srcDur < cut.dur ? 'ループ延長' : srcDur > cut.dur ? 'トリム' : '等尺'}）`);
  segs.push(out);
}

// ───────────────────────── 3) 連結＋無音トラック ─────────────────────────
const listFile = path.join(WORK, 'segs.txt');
fs.writeFileSync(listFile, segs.map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
const concatOut = path.join(WORK, 'concat.mp4');
await sh(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', concatOut]);

const final = path.join(SRC_DIR, `${OUT_NAME}.mp4`);
await sh(FFMPEG, [
  '-y', '-loglevel', 'error',
  '-i', concatOut,
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-shortest',
  '-movflags', '+faststart',
  final,
]);

if (!KEEP_WORK) fs.rmSync(WORK, { recursive: true, force: true });

const dur = await probe(final);
const mb = (fs.statSync(final).size / 1048576).toFixed(2);
console.log(`\n✓ 完成: ${final}`);
console.log(`  ${dur.toFixed(2)}s / ${W}x${H} / ${FPS}fps / ${mb}MB / 無音（音声は後工程でMacで付与）`);
