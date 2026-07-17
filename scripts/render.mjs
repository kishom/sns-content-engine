#!/usr/bin/env node
// render.mjs — コンテンツ台本(md)の「場面テーブル」から、音声つき9:16ショート動画(mp4)を書き出す。
//
// - 映像: カットごとにカードPNG2コマ（口パク＋ぴょこ揺れ）を Pillow(_render_card.py) で生成し、
//         3fpsで交互再生 → 30fps h264 に。
// - 音声: セリフ（🐱「…」🐶「…」）を macOS `say` の日本語TTSで読み上げ。
//         ネコ=ゆっくり低め / イヌ=早口元気。カット尺は音声に合わせて自動延長。
// - 依存: ffmpeg + python3/Pillow + macOS（say / 日本語フォント）。外部APIキー不要。
//
// 使い方:
//   node scripts/render.mjs content/2026-07-02_heatstroke
//   node scripts/render.mjs content/2026-07-17_bbq-goin.md
//
// 声の差し替え: NEKO_VOICE / INU_VOICE / NEKO_RATE / INU_RATE 環境変数（例: INU_VOICE=Sandy）

import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 30, ANIM_FPS = 3;
const PALETTE = ["#FDE9D9", "#E6F2E9", "#E9EEF9", "#F6E9F2", "#FBF3D9"];
const VOICE = {
  cat: { voice: process.env.NEKO_VOICE || "Kyoko", rate: Number(process.env.NEKO_RATE || 165) },
  dog: { voice: process.env.INU_VOICE || "Kyoko", rate: Number(process.env.INU_RATE || 235) },
};
const GAP = 0.3, LEAD = 0.25, TAIL_PAD = 0.45;

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

// --- 場面テーブルを解析（時間セルがある行だけ） ---
const rows = md.split("\n")
  .filter((l) => l.trim().startsWith("|"))
  .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
  .filter((c) => c.length >= 3 && /\d+\s*-\s*\d+\s*s/.test(c[0]));
if (!rows.length) fail("場面テーブル（| 時間 | セリフ | テロップ | …）が見つかりません");

// 表示用テキスト（絵文字除去・話者名短縮）。**強調** は《》に変換して赤字描画へ渡す。
function clean(s = "") {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "《$1》")
    .replace(/\*\*/g, "")
    .replace(/🐶/g, "イヌ:").replace(/🐱/g, "ネコ:")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
// TTS用テキスト（読みやすく整形）
function speakable(s) {
  return s
    .replace(/①/g, "1つ目。").replace(/②/g, "2つ目。").replace(/③/g, "3つ目。")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}#★→《》]/gu, "")
    .replace(/[“”"]/g, "")
    .trim();
}
// セリフセルから話者ごとの発話列を抽出
function dialogue(cell = "") {
  const segs = [];
  for (const m of cell.matchAll(/(🐶|🐱)[^「🐶🐱]*「([^」]+)」/g)) {
    segs.push({ who: m[1] === "🐱" ? "cat" : "dog", text: speakable(m[2]) });
  }
  return segs.filter((s) => s.text);
}

const scenes = rows.map((c) => {
  const m = c[0].match(/(\d+)\s*-\s*(\d+)\s*s/);
  return {
    scriptDur: Math.max(1, Number(m[2]) - Number(m[1])),
    serifu: clean(c[1]),
    telop: clean(c[2]),
    vis: clean(c[3] || ""),
    segs: dialogue(c[1]),
  };
});

// --- 作業ディレクトリ ---
const workDir = join(outDir, ".render");
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

// --- 1) 音声（TTS）: カットごとに合成し、実尺を確定 ---
const silence = join(workDir, "sil.wav");
ff(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(GAP), silence]);
const lead = join(workDir, "lead.wav");
ff(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(LEAD), lead]);

scenes.forEach((sc, i) => {
  const parts = [];
  sc.segs.forEach((seg, j) => {
    const v = VOICE[seg.who];
    const aiff = join(workDir, `tts_${i}_${j}.aiff`);
    execFileSync("say", ["-v", v.voice, "-r", String(v.rate), "-o", aiff, seg.text]);
    const wav = join(workDir, `tts_${i}_${j}.wav`);
    ff(["-i", aiff, "-ar", "44100", "-ac", "1", wav]);
    parts.push(wav);
  });
  const cutAudio = join(workDir, `audio_${i}.wav`);
  if (parts.length) {
    const list = join(workDir, `alist_${i}.txt`);
    const entries = [lead, ...parts.flatMap((p, k) => (k ? [silence, p] : [p]))];
    writeFileSync(list, entries.map((p) => `file '${basename(p)}'`).join("\n") + "\n");
    ff(["-f", "concat", "-safe", "0", "-i", list, cutAudio]);
    sc.audioDur = probeDur(cutAudio);
  } else {
    ff(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(sc.scriptDur), cutAudio]);
    sc.audioDur = 0;
  }
  sc.dur = Math.max(sc.scriptDur, Math.ceil((sc.audioDur + TAIL_PAD) * 10) / 10);
  sc.audio = cutAudio;
});

// --- 2) 口パク2コマのカードPNGを一括生成 ---
const cardSpec = {
  W, H,
  scenes: scenes.map((sc, i) => ({
    bg: PALETTE[i % PALETTE.length],
    telop: sc.telop || " ",
    serifu: sc.serifu || " ",
    vis: sc.vis || "",
    outs: [join(workDir, `card_${i}_0.png`), join(workDir, `card_${i}_1.png`)],
  })),
};
const specFile = join(workDir, "scenes.json");
writeFileSync(specFile, JSON.stringify(cardSpec));
execFileSync("python3", [join(__dirname, "_render_card.py"), specFile], { stdio: "inherit" });

// --- 3) カットごとに 映像(2コマループ)+音声 のセグメントを作る ---
const segList = [];
scenes.forEach((sc, i) => {
  const seg = join(workDir, `seg_${i}.mp4`);
  ff([
    "-stream_loop", "-1", "-framerate", String(ANIM_FPS), "-i", join(workDir, `card_${i}_%d.png`),
    "-i", sc.audio,
    "-t", String(sc.dur),
    "-r", String(FPS), "-pix_fmt", "yuv420p",
    "-c:v", "libx264", "-preset", "veryfast",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "1",
    seg,
  ]);
  segList.push(`file '${basename(seg)}'`);
  process.stdout.write(`  ✓ カット${i + 1}/${scenes.length} ${sc.dur}s(音声${sc.audioDur.toFixed(1)}s) ${sc.telop.slice(0, 14)}\n`);
});

// --- 4) 連結 ---
const listFile = join(workDir, "segs.txt");
writeFileSync(listFile, segList.join("\n") + "\n");
const outPath = join(outDir, `${outName}.mp4`);
ff(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath]);
rmSync(workDir, { recursive: true, force: true });

const total = scenes.reduce((a, s) => a + s.dur, 0);
console.log(`✓ 書き出し完了: ${outPath}`);
console.log(`  ${scenes.length}カット / 合計${total.toFixed(1)}s / ${W}x${H} @${FPS}fps / 口パク+TTS音声つき`);
console.log(`  声: ネコ=${VOICE.cat.voice}@${VOICE.cat.rate} イヌ=${VOICE.dog.voice}@${VOICE.dog.rate}（NEKO_VOICE等で変更可）`);
