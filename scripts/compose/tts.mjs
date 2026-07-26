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
//   1) 1セリフ = 1 WAV を **VOICEVOX CORE**（ニューラル合成）で合成（tts.py）。
//      キャラごとに別話者（styleId）を割り当てる＝1音声のピッチ違いではなく本当に別の声
//   2) 話速・抑揚・読点の間は **合成前の AudioQuery** で調整する（波形を後から切らない）
//   3) 実測長からカット内のセリフ配置を計算。音声が入りきらないカットは **尺を伸ばす**
//      （素材クリップはループ可能に作られているので compose.mjs 側が -stream_loop で埋める）
//   4) 全セグメントを絶対時刻に並べて 1 本にし、2パス loudnorm で -14 LUFS に整える
//
// ⚠️ 合成結果の読み（カナ）は voice.readings.txt に出る。**必ず目視で誤読を確認すること。**
// ⚠️ モーラ率（モーラ/秒）を最後に出す。日本語の自然な発話は 6〜8、早口で 9〜10。
//    ショート動画は 7.5〜8.5 くらいが「テンポよく、まだ聞き取れる」帯。
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
// VOICEVOX CORE は専用 venv に入れてある（README「VOICEVOX の入れ方」）。
// 無ければ system python にフォールバック（= pyopenjtalk エンジン）。
const VENV_PY = path.join(REPO, '.venv-voicevox', 'bin', 'python');
const PY = fs.existsSync(VENV_PY) ? VENV_PY : 'python3';
const ENGINE = process.env.TTS_ENGINE || (fs.existsSync(VENV_PY) ? 'voicevox' : 'openjtalk');

const FPS = 30;
const SR = 48000;
const TARGET_LUFS = -14;   // ショート標準（IG/TikTok/YouTube はおおむね -14 に合わせて再生される）

// ── 間（ま）の設計 ─────────────────────────────────────────────
// ⚠️ ここはテンポの生命線。ショート動画は「間」が積み上がると一気に冗長になる。
//    13セリフ = 8ギャップ + 7リード + 7テール あるので、0.1s の差が約 2.2s に効く。
//    env で上書きして sweep できるようにしてある（TEMPO_SWEEP=1 で比較用）。
const num = (k, d) => (process.env[k] != null ? Number(process.env[k]) : d);
const LEAD = num('V_LEAD', 0.10);      // カット頭 → 最初のセリフ
const GAP = num('V_GAP', 0.20);        // セリフ間（掛け合いの応酬感を出すため短め）
const PART_GAP = num('V_PART_GAP', 0.12); // 1セリフ内のセグメント間（①②③の列挙）
const TAIL = num('V_TAIL', 0.18);      // 最後のセリフ → カット終端
const HOLD = num('V_HOLD', 0.25);      // 音声が終わってから字幕を消すまでの余韻
const SPEED_MULT = num('V_SPEED', 1.0);   // 全話者の話速にかける倍率（sweep 用）
const PAUSE_MULT = num('V_PAUSE', 1.0);   // 読点の間にかける倍率（sweep 用）

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
        text,
        // VOICEVOX 用
        styleId: v.styleId,
        speedScale: (v.speedScale ?? 1.0) * SPEED_MULT * (cut.tempo?.speed ?? 1.0),
        pitchScale: v.pitchScale ?? 0,
        intonationScale: v.intonationScale ?? 1.0,
        pauseScale: (v.pauseScale ?? 1.0) * PAUSE_MULT,
        // pyopenjtalk フォールバック用
        speed: v.speed ?? 1.0, halfTone: v.halfTone ?? 0, formant: v.formant ?? 1.0,
      });
    });
  }
}
console.log(`エンジン: ${ENGINE}（${PY}）`);
console.log(`テンポ: speed×${SPEED_MULT} / pause×${PAUSE_MULT} / lead ${LEAD}s gap ${GAP}s partGap ${PART_GAP}s tail ${TAIL}s`);
console.log(`セリフ ${CUTS.reduce((n, c) => n + (c.subs || []).length, 0)}本 / 音声セグメント ${jobs.length}本`);

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

// ───────────────────────── 2) pyopenjtalk で合成 ─────────────────────────
const rawDir = path.join(WORK, 'raw');
const { out: ttsOut } = await sh(PY, [path.join(here, 'tts.py')], JSON.stringify({
  engine: ENGINE, sr: SR, outDir: rawDir,
  jobs: jobs.map((j) => ({
    id: j.id, text: j.text,
    styleId: j.styleId, speedScale: j.speedScale, pitchScale: j.pitchScale,
    intonationScale: j.intonationScale, pauseScale: j.pauseScale,
    speed: j.speed, halfTone: j.halfTone,
  })),
}));
const synth = JSON.parse(ttsOut).results;
const byId = new Map(synth.map((r) => [r.id, r]));

// 読み（カナ）を必ず書き出す＝誤読チェックの一次資料
const readLines = jobs.map((j) => {
  const r = byId.get(j.id);
  return `[${j.id}] ${SPEAKERS[j.who].name}（${SPEAKERS[j.who].voice.label || 'style ' + j.styleId}）\n`
    + `  text: ${j.text}\n  kana: ${r.kana}\n`
    + `  dur : ${r.dur.toFixed(2)}s / ${r.mora}モーラ / ${r.moraPerSec.toFixed(1)} モーラ毎秒`;
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
const outSubsEnd = new Map();  // cutId → [各字幕の音声終了時刻]（フック要件の検算用）
let cutStart = 0;   // カット頭の絶対時刻

for (const cut of CUTS) {
  const subs = cut.subs || [];
  // カット単位で「間」を上書きできる（例: フックは食い気味に返す＝lead/gap を詰める）
  const lead = cut.tempo?.lead ?? LEAD;
  const gap = cut.tempo?.gap ?? GAP;
  let t = lead;
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
    t += gap;
  }

  outSubsEnd.set(cut.id, outSubs.map((s) => s.audioEnd));
  const lastEnd = subs.length ? t - gap : 0;
  // 音声が入りきらないなら尺を伸ばす。
  // floor は既定で無音版と同じ cut.dur だが、`voiceDur` があれば音声版だけ別の下限にする。
  // ⚠️ cut.dur を直接いじってはいけない。無音版 (cat-ckd_reel.mp4) の時間割も変わってしまう。
  //    音声版だけ「セリフが終わったのに絵が流れ続ける無音の余り」を削りたいときは voiceDur を使う。
  const floor = cut.voiceDur ?? cut.dur;
  const dur = ceilFrame(Math.max(floor, lastEnd + TAIL));

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
    // 音声＋間で実際に必要な尺。origDur より短い＝そのカットに無音の余りがある
    // （＝「間延び」の正体。テンポ調整では話速よりここを先に疑う）
    needed: Number((lastEnd + TAIL).toFixed(3)),
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
  const slack = c.dur - c.needed;   // 音声が無いまま流れる時間
  console.log(`  ${c.id}: ${c.origDur.toFixed(2)}s → ${c.dur.toFixed(2)}s `
    + `${grew ? `(+${(c.dur - c.origDur).toFixed(2)} ループ延長)` : '(据え置き)'}`
    + `${slack > 0.3 ? `  ⚠ 無音の余り ${slack.toFixed(2)}s` : ''}`);
}
console.log(`  合計: ${CUTS.reduce((a, c) => a + c.dur, 0).toFixed(2)}s → ${total.toFixed(2)}s`);

// ── テンポの客観指標 ──────────────────────────────────────────
// 「速すぎ／遅すぎ」を耳の主観でなく数字で判断するための出力。
const moraTotal = synth.reduce((a, r) => a + (r.mora || 0), 0);
const speechTotal = synth.reduce((a, r) => a + r.dur, 0);
const rate = moraTotal / speechTotal;
const perWho = ['cat', 'dog'].map((who) => {
  const ids = new Set(jobs.filter((j) => j.who === who).map((j) => j.id));
  const rs = synth.filter((r) => ids.has(r.id));
  const m = rs.reduce((a, r) => a + r.mora, 0), d = rs.reduce((a, r) => a + r.dur, 0);
  return `${SPEAKERS[who].name} ${(m / d).toFixed(1)}`;
}).join(' / ');
console.log(`\nテンポ: 全体 ${rate.toFixed(1)} モーラ毎秒（${perWho}）`);
console.log(`  発話 ${speechTotal.toFixed(2)}s / 間 ${(total - speechTotal).toFixed(2)}s（間の比率 ${(100 * (1 - speechTotal / total)).toFixed(0)}%）`);
console.log('  目安: 6〜8=自然な会話 / 7.5〜8.5=ショート向き / 9以上=早口で聞き取りにくい');
// フック要件: cut-01 の反転（ネコの2本目）が 2.5s 以内に言い終わること
{
  const c1 = timing.cuts.find((c) => c.id === 'cut-01');
  const s2 = c1 && c1.subs[1];
  if (s2) {
    const audioEnd = (outSubsEnd.get('cut-01') || [])[1];
    if (audioEnd != null) {
      console.log(`  フック反転の言い終わり: ${audioEnd.toFixed(2)}s ${audioEnd <= 2.5 ? '✓ ≦2.5s' : '✗ 2.5s 超過'}`);
    }
  }
}

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
timing.meta.tts = ENGINE === 'voicevox'
  ? 'VOICEVOX CORE 0.15.7 (CPU / ONNX Runtime 1.13.1)'
  : 'pyopenjtalk 0.4.1 (Open JTalk / HTS mei_normal)';
timing.meta.speakers = Object.fromEntries(
  Object.entries(SPEAKERS).map(([k, s]) => [k, { name: s.name, voice: s.voice }]));
timing.meta.tempo = {
  moraPerSec: Number(rate.toFixed(2)), lead: LEAD, gap: GAP, partGap: PART_GAP, tail: TAIL,
  speedMult: SPEED_MULT, pauseMult: PAUSE_MULT,
};
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
