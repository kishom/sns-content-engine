#!/usr/bin/env node
// tts.mjs — script.config.mjs の字幕データから日本語音声を合成し、
//           **音声の実測長でタイムラインを引き直して** 1本のボイストラックを作る。
//
// 使い方:
//   node scripts/compose/tts.mjs            # 音声合成 → voice.wav + voice.timing.json
//   KEEP_WORK=1 node scripts/compose/tts.mjs  # 中間ファイル(.voice/)を残す
//   node scripts/compose/tts.mjs --dry      # 合成せず読み（カナ）だけ出す＝誤読チェック用
//
// この後に `node scripts/compose/compose.mjs --voice` を実行すると、
// ここで書いた timing に合わせてテロップを焼き直し、音声を多重化した _voiced.mp4 ができる。
//
// 設計:
//   1) 1セリフ = 1 WAV を pyopenjtalk で合成（tts.py）。話者ごとに speed / halfTone を変える
//   2) ffmpeg の asetrate+atempo でフォルマント（声の太さ）をずらし、2キャラを聞き分け可能にする
//   3) 実測長からカット内のセリフ配置を計算。音声が入りきらないカットは **尺を伸ばす**
//      （素材クリップはループ可能に作られているので compose.mjs 側が -stream_loop で埋める）
//   4) 全セグメントを絶対時刻に並べて 1 本にし、2パス loudnorm で -14 LUFS に整える
//
// ⚠️ 合成結果の読み（カナ）は voice.readings.txt に出る。**必ず目視で誤読を確認すること。**
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { CUTS, PROJECT, SPEAKERS } from './script.config.mjs';

const require = createRequire(import.meta.url);
const FFMPEG = require('@ffmpeg-installer/ffmpeg').path;
const FFPROBE = require('@ffprobe-installer/ffprobe').path;

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const SRC_DIR = path.join(REPO, 'content', PROJECT);
const WORK = path.join(here, '.voice');
const PY = 'python3';

const FPS = 30;
const SR = 48000;
const TARGET_LUFS = -14;   // ショート標準（IG/TikTok/YouTube はおおむね -14 に合わせて再生される）

// ── 間（ま）の設計 ─────────────────────────────────────────────
const LEAD = 0.18;      // カット頭 → 最初のセリフ
const GAP = 0.38;       // セリフ間（指定 0.3〜0.5 の中央）
const PART_GAP = 0.20;  // 1セリフ内のセグメント間（①②③の列挙）
const TAIL = 0.35;      // 最後のセリフ → カット終端
const HOLD = 0.30;      // 音声が終わってから字幕を消すまでの余韻

const DRY = process.argv.includes('--dry');
const KEEP_WORK = process.env.KEEP_WORK === '1';

const sh = (cmd, args, stdin) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: [stdin == null ? 'ignore' : 'pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (c) => (c === 0 ? res({ out, err }) : rej(new Error(`${path.basename(cmd)} exit ${c}\n${err.slice(-3000)}`))));
    if (stdin != null) { p.stdin.write(stdin); p.stdin.end(); }
  });

const probeDur = async (f) =>
  Number((await sh(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f])).out.trim());

/** 字幕テキスト → 読み上げ用のプレーンテキスト（<br>・全角空白・強調タグを除去） */
const speech = (t) =>
  t.replace(/<br\s*\/?>/g, '').replace(/<\/?em>/g, '').replace(/　/g, '、').trim();

/** 秒をフレーム境界に切り上げる（concat のズレ防止） */
const ceilFrame = (s) => Math.ceil(s * FPS - 1e-6) / FPS;

// ───────────────────────── 1) 合成ジョブを組む ─────────────────────────
const jobs = [];
for (const cut of CUTS) {
  for (const [i, s] of (cut.subs || []).entries()) {
    const base = s.read != null ? s.read : speech(s.text);
    const parts = s.parts && s.parts.length ? s.parts : [base];
    parts.forEach((text, k) => {
      const v = (SPEAKERS[s.who] && SPEAKERS[s.who].voice) || {};
      jobs.push({
        id: `${cut.id}_s${i + 1}_p${k}`,
        cut: cut.id, sub: i, part: k, who: s.who,
        text, speed: v.speed ?? 1.0, halfTone: v.halfTone ?? 0, formant: v.formant ?? 1.0,
        maxPause: v.maxPause ?? 0,
      });
    });
  }
}
console.log(`セリフ ${CUTS.reduce((n, c) => n + (c.subs || []).length, 0)}本 / 音声セグメント ${jobs.length}本`);

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

// ───────────────────────── 2) pyopenjtalk で合成 ─────────────────────────
const rawDir = path.join(WORK, 'raw');
const { out: ttsOut } = await sh(PY, [path.join(here, 'tts.py')], JSON.stringify({
  outDir: rawDir,
  jobs: jobs.map((j) => ({ id: j.id, text: j.text, speed: j.speed, halfTone: j.halfTone, maxPause: j.maxPause })),
}));
const synth = JSON.parse(ttsOut).results;
const byId = new Map(synth.map((r) => [r.id, r]));

// 読み（カナ）を必ず書き出す＝誤読チェックの一次資料
const readLines = jobs.map((j) => {
  const r = byId.get(j.id);
  return `[${j.id}] ${j.who === 'cat' ? 'ネコネコ' : 'イヌイヌ'}\n  text: ${j.text}\n  kana: ${r.kana}\n  dur : ${r.dur.toFixed(2)}s`;
});
const readingsFile = path.join(WORK, 'voice.readings.txt');
fs.writeFileSync(readingsFile, readLines.join('\n') + '\n');
console.log(`読み（カナ）→ ${readingsFile}`);

if (DRY) {
  console.log('\n' + readLines.join('\n'));
  console.log('\n--dry のため合成のみ。誤読があれば script.config.mjs の read: を直す。');
  process.exit(0);
}

// ───────────────── 3) 声づくり（フォルマント）＋実測 ─────────────────
const procDir = path.join(WORK, 'proc');
fs.mkdirSync(procDir, { recursive: true });
for (const j of jobs) {
  const src = byId.get(j.id).file;
  const dst = path.join(procDir, `${j.id}.wav`);
  const f = j.formant;
  // asetrate で声道ごとピッチを動かし、atempo で尺だけ戻す＝フォルマントシフト
  const af = Math.abs(f - 1) < 1e-6
    ? `aresample=${SR}`
    : `asetrate=${Math.round(SR * f)},aresample=${SR},atempo=${(1 / f).toFixed(6)}`;
  await sh(FFMPEG, ['-y', '-loglevel', 'error', '-i', src, '-af', af, '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', dst]);
  j.file = dst;
  j.dur = await probeDur(dst);
}

// ───────────────── 4) 実測長からタイムラインを引き直す ─────────────────
const timing = { cuts: [], meta: { fps: FPS, lead: LEAD, gap: GAP, partGap: PART_GAP, tail: TAIL, hold: HOLD } };
const place = [];   // 絶対時刻に置くセグメント
let cutStart = 0;   // カット頭の絶対時刻

for (const cut of CUTS) {
  const subs = cut.subs || [];
  let t = LEAD;
  const outSubs = [];
  const partStarts = [];    // [subIndex][partIndex] = カット内の秒

  for (const [i, s] of subs.entries()) {
    const segs = jobs.filter((j) => j.cut === cut.id && j.sub === i).sort((a, b) => a.part - b.part);
    const start = t;
    const starts = [];
    for (const [k, seg] of segs.entries()) {
      if (k) t += PART_GAP;
      starts.push(t);
      place.push({ file: seg.file, at: cutStart + t });
      t += seg.dur;
    }
    partStarts[i] = starts;
    const audioEnd = t;
    // 元の定義で end を省略している字幕は「カット終端まで」＝そのまま踏襲する
    outSubs.push({ start, audioEnd, end: s.end == null ? null : audioEnd + HOLD });
    t += GAP;
  }

  const lastEnd = subs.length ? t - GAP : 0;
  // 音声が入りきらないなら尺を伸ばす（縮めはしない＝映像の演出尺を壊さない）
  const dur = ceilFrame(Math.max(cut.dur, lastEnd + TAIL));

  const outChips = (cut.checkChips || []).map((c) => {
    // anchorPart があれば、対応する音声セグメントの実測開始に吸着させる
    if (c.anchorPart != null) {
      for (let i = 0; i < partStarts.length; i++) {
        if (partStarts[i] && partStarts[i][c.anchorPart] != null && subs[i].parts) {
          return { start: Number(partStarts[i][c.anchorPart].toFixed(3)), end: c.end ?? null };
        }
      }
    }
    return { start: c.start, end: c.end ?? null };
  });

  timing.cuts.push({
    id: cut.id,
    dur: Number(dur.toFixed(3)),
    origDur: cut.dur,
    subs: outSubs.map((s) => ({
      start: Number(s.start.toFixed(3)),
      end: s.end == null ? null : Number(Math.min(s.end, dur).toFixed(3)),
    })),
    checkChips: outChips,
  });
  cutStart += dur;
}

const total = cutStart;
console.log('\nカット尺（無音版 → 音声版）:');
for (const c of timing.cuts) {
  const grew = c.dur > c.origDur + 1e-6;
  console.log(`  ${c.id}: ${c.origDur.toFixed(2)}s → ${c.dur.toFixed(2)}s ${grew ? `(+${(c.dur - c.origDur).toFixed(2)} ループ延長)` : '(据え置き)'}`);
}
console.log(`  合計: ${CUTS.reduce((a, c) => a + c.dur, 0).toFixed(2)}s → ${total.toFixed(2)}s`);

// ───────────────── 5) 1本のトラックに並べる → loudnorm ─────────────────
const rawMix = path.join(WORK, 'voice_raw.wav');
await sh(PY, [path.join(here, 'tts.py')], JSON.stringify({ mode: 'mix', out: rawMix, sr: SR, total, place }));

// loudnorm 1パス目＝実測、2パス目＝実測値を渡して線形補正（1パスだけだと動的圧縮で音が揺れる）
const { err: lnErr } = await sh(FFMPEG, [
  '-hide_banner', '-i', rawMix,
  '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:print_format=json`,
  '-f', 'null', '-',
]);
const m = lnErr.slice(lnErr.lastIndexOf('{'), lnErr.lastIndexOf('}') + 1);
const meas = JSON.parse(m);
console.log(`\nloudnorm 1st pass: I=${meas.input_i} LUFS / TP=${meas.input_tp} / LRA=${meas.input_lra}`);

const voiceWav = path.join(WORK, 'voice.wav');
await sh(FFMPEG, [
  '-y', '-loglevel', 'error', '-i', rawMix,
  '-af', [
    `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11`,
    `measured_I=${meas.input_i}:measured_TP=${meas.input_tp}`,
    `measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}`,
    `offset=${meas.target_offset}:linear=true:print_format=summary`,
  ].join(':'),
  '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s16le', voiceWav,
]);

// BGM を足すときはここに mix 段を挟む（現状 BGM 無し＝声だけ）。README 参照。
const finalWav = path.join(SRC_DIR, 'voice.wav');
fs.copyFileSync(voiceWav, finalWav);
fs.copyFileSync(readingsFile, path.join(SRC_DIR, 'voice.readings.txt'));

timing.meta.total = Number(total.toFixed(3));
timing.meta.voiceWav = 'voice.wav';
timing.meta.targetLufs = TARGET_LUFS;
timing.meta.generatedAt = new Date().toISOString();
timing.meta.tts = 'pyopenjtalk 0.4.1 (Open JTalk / HTS mei_normal)';
const timingFile = path.join(here, 'voice.timing.json');
fs.writeFileSync(timingFile, JSON.stringify(timing, null, 2) + '\n');

if (!KEEP_WORK) {
  // raw/proc は消すが、書き出した wav と読み一覧は content/ 側に残してある
  fs.rmSync(rawDir, { recursive: true, force: true });
  fs.rmSync(procDir, { recursive: true, force: true });
}

console.log(`\n✓ 音声: ${finalWav}（${(await probeDur(finalWav)).toFixed(2)}s / ${TARGET_LUFS} LUFS 目標）`);
console.log(`✓ 時間割: ${timingFile}`);
console.log(`✓ 読み一覧: ${path.join(SRC_DIR, 'voice.readings.txt')} ← 誤読チェックはこれを読む`);
console.log(`\n次: node scripts/compose/compose.mjs --voice`);
