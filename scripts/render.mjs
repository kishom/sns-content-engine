#!/usr/bin/env node
// render.mjs — コンテンツ台本(md)の「場面テーブル」から、音声つき9:16ショート動画(mp4)を書き出す。
//
// - セリフは話者の頭上に吹き出しで1行ずつ表示（TTS音声と同期）。
// - 話者は4コマの口パク＋ぴょこ揺れ、待機中は2コマの呼吸アニメ。
// - 音声: macOS `say`(Kyoko)。ネコ=ゆっくり/イヌ=早口。最後に-15LUFSへラウドネス正規化。
// - 依存: ffmpeg + python3/Pillow + macOS（say / 日本語フォント）。外部APIキー不要。
//
// 使い方:
//   node scripts/render.mjs content/2026-07-02_heatstroke
//   node scripts/render.mjs content/2026-07-17_skit-osanpo.md
//
// 声の差し替え: NEKO_VOICE / INU_VOICE / NEKO_RATE / INU_RATE 環境変数

import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 30, ANIM_FPS = 6;
const PALETTE = ["#FDE9D9", "#E6F2E9", "#E9EEF9", "#F6E9F2", "#FBF3D9"];
const VOICE = {
  cat: { voice: process.env.NEKO_VOICE || "Kyoko", rate: Number(process.env.NEKO_RATE || 165) },
  dog: { voice: process.env.INU_VOICE || "Kyoko", rate: Number(process.env.INU_RATE || 235) },
};
const LINE_PAD = 0.45;   // セリフ間の間（秒）
const MIN_IDLE = 0.4;    // これ未満の余りは無視

function fail(m) { console.error(`✗ ${m}`); process.exit(1); }
function ff(args) { execFileSync("ffmpeg", ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] }); }
function probeDur(f) {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", f]).toString().trim());
}

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

// --- 場面テーブルを解析 ---
const rows = md.split("\n")
  .filter((l) => l.trim().startsWith("|"))
  .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
  .filter((c) => c.length >= 3 && /\d+\s*-\s*\d+\s*s/.test(c[0]));
if (!rows.length) fail("場面テーブル（| 時間 | セリフ | テロップ | …）が見つかりません");

// 表示用テキスト。**強調** は《》に変換して赤字描画へ渡す。
function clean(s = "") {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "《$1》")
    .replace(/\*\*/g, "")
    .replace(/🐶/g, "イヌ:").replace(/🐱/g, "ネコ:")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
// TTS用テキスト
function speakable(s) {
  return s
    .replace(/①/g, "1つ目。").replace(/②/g, "2つ目。").replace(/③/g, "3つ目。")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}#★→《》]/gu, "")
    .replace(/[“”"]/g, "")
    .trim();
}
// セリフセルから話者ごとの発話列（表示用/読み上げ用）を抽出
function dialogue(cell = "") {
  const segs = [];
  for (const m of cell.matchAll(/(🐶|🐱)[^「🐶🐱]*「([^」]+)」/g)) {
    const inner = m[2];
    segs.push({
      who: m[1] === "🐱" ? "cat" : "dog",
      text: speakable(inner),
      disp: inner.replace(/[《》]/g, "").replace(/[\u{1F000}-\u{1FAFF}\u{FE0F}]/gu, "").trim(),
    });
  }
  return segs.filter((s) => s.text);
}

const scenes = rows.map((c) => {
  const m = c[0].match(/(\d+)\s*-\s*(\d+)\s*s/);
  return {
    scriptDur: Math.max(1, Number(m[2]) - Number(m[1])),
    telop: clean(c[2]),
    vis: clean(c[3] || ""),
    segs: dialogue(c[1]),
  };
});

// --- 作業ディレクトリ ---
const workDir = join(outDir, ".render");
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

// --- 1) シーン→ショット分解（1セリフ=1ショット、余り時間=待機ショット） ---
// ショット: {bg, telop, vis, who|null, bubble|null, dur, audio|null, frames:[]}
const shots = [];
scenes.forEach((sc, i) => {
  const bg = PALETTE[i % PALETTE.length];
  let used = 0;
  sc.segs.forEach((seg, j) => {
    const v = VOICE[seg.who];
    const aiff = join(workDir, `tts_${i}_${j}.aiff`);
    execFileSync("say", ["-v", v.voice, "-r", String(v.rate), "-o", aiff, seg.text]);
    const wav = join(workDir, `tts_${i}_${j}.wav`);
    ff(["-i", aiff, "-ar", "44100", "-ac", "1", wav]);
    const dur = Math.ceil((probeDur(wav) + LINE_PAD) * 10) / 10;
    used += dur;
    shots.push({ bg, telop: sc.telop, vis: sc.vis, who: seg.who, bubble: seg.disp, dur, audio: wav });
  });
  const rest = sc.scriptDur - used;
  if (rest >= MIN_IDLE || sc.segs.length === 0) {
    shots.push({ bg, telop: sc.telop, vis: sc.vis, who: null, bubble: null,
                 dur: sc.segs.length ? rest : sc.scriptDur, audio: null });
  }
});

// --- 2) フレームPNG一括生成（話者ショット=4コマ / 待機=2コマ） ---
const spec = {
  W, H,
  shots: shots.map((sh, k) => {
    const n = sh.who ? 4 : 2;
    sh.frames = Array.from({ length: n }, (_, p) => join(workDir, `f_${k}_${p}.png`));
    return { bg: sh.bg, telop: sh.telop, vis: sh.vis, who: sh.who, bubble: sh.bubble, outs: sh.frames };
  }),
};
const specFile = join(workDir, "shots.json");
writeFileSync(specFile, JSON.stringify(spec));
execFileSync("python3", [join(__dirname, "_render_card.py"), specFile], { stdio: "inherit" });

// --- 3) ショットごとにセグメント動画（音声はapadで映像と同尺=ズレ防止） ---
const segList = [];
shots.forEach((sh, k) => {
  const seg = join(workDir, `seg_${k}.mp4`);
  const audioIn = sh.audio
    ? ["-i", sh.audio]
    : ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono"];
  ff([
    "-stream_loop", "-1", "-framerate", String(ANIM_FPS), "-i", join(workDir, `f_${k}_%d.png`),
    ...audioIn,
    "-t", String(sh.dur),
    "-af", "apad",
    "-r", String(FPS), "-pix_fmt", "yuv420p",
    "-c:v", "libx264", "-preset", "veryfast",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "1",
    "-shortest",
    seg,
  ]);
  segList.push(`file '${basename(seg)}'`);
});

// --- 4) 連結 → ラウドネス正規化（-15LUFS, ショート標準） ---
const listFile = join(workDir, "segs.txt");
writeFileSync(listFile, segList.join("\n") + "\n");
const tmpOut = join(workDir, "concat.mp4");
ff(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", tmpOut]);
const outPath = join(outDir, `${outName}.mp4`);
ff(["-i", tmpOut, "-c:v", "copy",
    "-af", "loudnorm=I=-15:TP=-1.5:LRA=11",
    "-c:a", "aac", "-b:a", "128k", outPath]);
rmSync(workDir, { recursive: true, force: true });

const total = shots.reduce((a, s) => a + s.dur, 0);
console.log(`✓ 書き出し完了: ${outPath}`);
console.log(`  ${scenes.length}シーン/${shots.length}ショット / 合計${total.toFixed(1)}s / 吹き出し同期+4コマ口パク+ラウドネス正規化`);
console.log(`  声: ネコ=${VOICE.cat.voice}@${VOICE.cat.rate} イヌ=${VOICE.dog.voice}@${VOICE.dog.rate}（NEKO_VOICE等で変更可）`);
