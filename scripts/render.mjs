#!/usr/bin/env node
// render.mjs — コンテンツ台本(md)の「場面テーブル」を読み、9:16のショート動画(mp4)を書き出す。
//
// 台本のテーブル（| 時間 | セリフ | テロップ | ビジュアル |）から各カットの尺を計算し、
// テロップを大きく・セリフを下に配置したパステルのカードPNGを Pillow(_render_card.py) で生成、
// ffmpeg で1本のmp4に連結する。外部APIキー不要（依存: ffmpeg + python3/Pillow + macOS日本語フォント）。
//
// 使い方:
//   node scripts/render.mjs content/2026-07-02_heatstroke
//   node scripts/render.mjs content/2026-07-02_pad-burn.md
//
// 出力: 対象フォルダ（or 同名）に <name>.mp4 を生成。

import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 30;
const PALETTE = ["#FDE9D9", "#E6F2E9", "#E9EEF9", "#F6E9F2", "#FBF3D9"];

function fail(m) { console.error(`✗ ${m}`); process.exit(1); }

// --- 入力解決 ---
const target = process.argv[2];
if (!target) fail("使い方: node scripts/render.mjs <content/フォルダ or .md>");
let scriptPath, outDir, outName;
const st = statSync(target);
if (st.isDirectory()) {
  outDir = target;
  const cand = ["02-script.md", "script.md"].find((f) => {
    try { return statSync(join(target, f)).isFile(); } catch { return false; }
  }) || readdirSync(target).find((f) => f.endsWith(".md"));
  if (!cand) fail(`台本(.md)が見つかりません: ${target}`);
  scriptPath = join(target, cand);
  outName = basename(target);
} else {
  scriptPath = target;
  outDir = dirname(target);
  outName = basename(target, ".md");
}

const md = readFileSync(scriptPath, "utf8");

// --- 場面テーブルを解析（時間セルがある行だけ） ---
const rows = md.split("\n")
  .filter((l) => l.trim().startsWith("|"))
  .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
  .filter((c) => c.length >= 3 && /\d+\s*-\s*\d+\s*s/.test(c[0]));

if (!rows.length) fail("場面テーブル（| 時間 | セリフ | テロップ | …）が見つかりません");

// 絵文字・markdown装飾を除去し、話者マーカーを短縮
function clean(s = "") {
  return s
    .replace(/\*\*/g, "")
    .replace(/🐶/g, "イヌ:").replace(/🐱/g, "ネコ:")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const scenes = rows.map((c) => {
  const m = c[0].match(/(\d+)\s*-\s*(\d+)\s*s/);
  return { dur: Math.max(1, Number(m[2]) - Number(m[1])), serifu: clean(c[1]), telop: clean(c[2]) };
});

// --- 作業ディレクトリ ---
const workDir = join(outDir, ".render");
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

// --- 1) PillowでカードPNGを一括生成 ---
const cardSpec = {
  W, H,
  scenes: scenes.map((sc, i) => ({
    bg: PALETTE[i % PALETTE.length],
    telop: sc.telop || " ",
    serifu: sc.serifu || " ",
    out: join(workDir, `card_${i}.png`),
  })),
};
const specFile = join(workDir, "scenes.json");
writeFileSync(specFile, JSON.stringify(cardSpec));
execFileSync("python3", [join(__dirname, "_render_card.py"), specFile], { stdio: "inherit" });

// --- 2) 各カードを尺ぶんの動画セグメントに ---
const segList = [];
scenes.forEach((sc, i) => {
  const png = join(workDir, `card_${i}.png`);
  const seg = join(workDir, `seg_${i}.mp4`);
  execFileSync("ffmpeg", [
    "-y", "-loop", "1", "-framerate", String(FPS), "-t", String(sc.dur), "-i", png,
    "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "veryfast",
    seg,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  segList.push(`file '${basename(seg)}'`); // concatリストは segs.txt からの相対で解決される
  process.stdout.write(`  ✓ カット${i + 1}/${scenes.length} (${sc.dur}s) ${sc.telop.slice(0, 14)}\n`);
});

// --- 3) 連結 ---
const listFile = join(workDir, "segs.txt");
writeFileSync(listFile, segList.join("\n") + "\n");
const outPath = join(outDir, `${outName}.mp4`);
execFileSync("ffmpeg", [
  "-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath,
], { stdio: ["ignore", "ignore", "pipe"] });

rmSync(workDir, { recursive: true, force: true });

const total = scenes.reduce((a, s) => a + s.dur, 0);
console.log(`✓ 書き出し完了: ${outPath}`);
console.log(`  ${scenes.length}カット / 合計${total}s / ${W}x${H} @${FPS}fps`);
console.log("  ※ テロップ＋セリフのカード動画。キャラ画像は prompts/05-visual.md で生成後に差し込む想定。");
