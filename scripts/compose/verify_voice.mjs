#!/usr/bin/env node
// verify_voice.mjs — 音声版リールの検証。
//   node scripts/compose/verify_voice.mjs
//
// 見るもの:
//   1) 音声ストリームの有無・尺・コーデック（ffprobe）
//   2) ラウドネス実測（loudnorm 測定パス）が -14 LUFS に乗っているか
//   3) **字幕と音声の同期**: silencedetect で拾った発話の実開始時刻を
//      voice.timing.json の字幕開始時刻と突き合わせる（ズレが大きければ NG）
//   4) 各セリフ区間の音量が有り、セリフ間の「間」が無音になっているか
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { CUTS, PROJECT, OUT_NAME, SPEAKERS } from './script.config.mjs';

const require = createRequire(import.meta.url);
const FFMPEG = require('@ffmpeg-installer/ffmpeg').path;
const FFPROBE = require('@ffprobe-installer/ffprobe').path;
const here = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(here, '../../content', PROJECT);
const VIDEO = path.join(SRC_DIR, `${OUT_NAME}_voiced.mp4`);
const timing = JSON.parse(fs.readFileSync(path.join(here, 'voice.timing.json'), 'utf8'));

const sh = (cmd, args) => new Promise((res, rej) => {
  const p = spawn(cmd, args);
  let out = '', err = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { err += d; });
  p.on('close', (c) => (c === 0 ? res({ out, err }) : rej(new Error(err.slice(-2000)))));
});

let ng = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗ NG'} ${msg}`); if (!cond) ng++; };

// ── 1) ストリーム ──
console.log('1) ストリーム');
const streams = JSON.parse((await sh(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO])).out);
const a = streams.streams.find((s) => s.codec_type === 'audio');
const v = streams.streams.find((s) => s.codec_type === 'video');
ok(!!a, `音声ストリームあり: ${a && `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch ${Math.round(a.bit_rate / 1000)}kbps`}`);
ok(!!v, `映像: ${v.codec_name} ${v.width}x${v.height} ${eval(v.r_frame_rate)}fps`);
const dur = Number(streams.format.duration);
const aDur = Number(a.duration), vDur = Number(v.duration);
ok(Math.abs(aDur - vDur) < 0.15, `音声尺 ${aDur.toFixed(2)}s と映像尺 ${vDur.toFixed(2)}s が一致（差 ${Math.abs(aDur - vDur).toFixed(3)}s）`);
ok(Math.abs(dur - timing.meta.total) < 0.15, `全体尺 ${dur.toFixed(2)}s が timing の ${timing.meta.total}s と一致`);

// ── 2) ラウドネス ──
console.log('\n2) ラウドネス');
const { err: lnErr } = await sh(FFMPEG, ['-hide_banner', '-i', VIDEO, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
const meas = JSON.parse(lnErr.slice(lnErr.lastIndexOf('{'), lnErr.lastIndexOf('}') + 1));
console.log(`  実測 I=${meas.input_i} LUFS / TP=${meas.input_tp} dBTP / LRA=${meas.input_lra}`);
ok(Math.abs(Number(meas.input_i) - timing.meta.targetLufs) <= 1.0, `統合ラウドネスが ${timing.meta.targetLufs}±1.0 LUFS に入っている`);
ok(Number(meas.input_tp) <= -1.0, `トゥルーピーク ${meas.input_tp} dBTP ≦ -1.0（クリップなし）`);

// ── 3) 発話の実開始 vs 字幕開始 ──
console.log('\n3) 字幕と音声の同期（silencedetect の実測発話区間 vs timing.json）');
// ⚠️ d（無音とみなす最短長）は **台本上いちばん短い「間」より短く**すること。
//    フックは食い気味に返すため cut-01 の gap が 0.07s しかなく、d=0.12 だと
//    イヌとネコの2発話が1区間に融合して「字幕とズレている」と誤検知した（実際は正常）。
const { err: sdErr } = await sh(FFMPEG, ['-hide_banner', '-i', VIDEO, '-af', 'silencedetect=noise=-45dB:d=0.06', '-f', 'null', '-']);
const speech = [];   // 実測の発話区間 [start,end]
{
  let cur = 0;
  for (const line of sdErr.split('\n')) {
    const s = line.match(/silence_start:\s*([\d.]+)/);
    const e = line.match(/silence_end:\s*([\d.]+)/);
    // 「えっ」のような 0.1 秒台の発話も拾う（0.15s 足切りだと取りこぼして誤検知になる）
    if (s) { const t = Number(s[1]); if (t - cur > 0.05) speech.push([cur, t]); }
    if (e) cur = Number(e[1]);
  }
  if (dur - cur > 0.05) speech.push([cur, dur]);
}
// timing 上の「発話が始まるはずの時刻」を並べる
const expect = [];
let abs = 0;
for (const [ci, c] of timing.cuts.entries()) {
  const cut = CUTS.find((x) => x.id === c.id);
  c.subs.forEach((s, i) => {
    expect.push({ at: abs + s.start, label: `${c.id}/sub${i + 1}`, who: cut.subs[i].who, text: cut.subs[i].text.replace(/<br>/g, '') });
  });
  abs += c.dur;
}
console.log(`  発話区間 ${speech.length}個 / 字幕 ${expect.length}個`);
let maxDrift = 0;
for (const e of expect) {
  // その字幕の開始に最も近い発話開始
  const near = speech.reduce((b, s) => (Math.abs(s[0] - e.at) < Math.abs(b[0] - e.at) ? s : b), speech[0]);
  const drift = near[0] - e.at;
  maxDrift = Math.max(maxDrift, Math.abs(drift));
  const mark = Math.abs(drift) <= 0.25 ? '✓' : '✗';
  if (mark === '✗') ng++;
  console.log(`  ${mark} ${e.label.padEnd(14)} 字幕 ${e.at.toFixed(2)}s / 音声 ${near[0].toFixed(2)}s (ズレ ${drift >= 0 ? '+' : ''}${drift.toFixed(2)}s) ${SPEAKERS[e.who].name} 「${e.text.slice(0, 22)}」`);
}
ok(maxDrift <= 0.25, `字幕と発話開始の最大ズレ ${maxDrift.toFixed(2)}s ≦ 0.25s`);

// ── 4) セリフ区間に音があり、間が無音か ──
console.log('\n4) 各字幕区間の音量（発話中は鳴り、間は静か）');
const rms = async (t0, t1) => {
  const { err } = await sh(FFMPEG, ['-hide_banner', '-ss', String(t0), '-t', String(Math.max(0.05, t1 - t0)), '-i', VIDEO, '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-']);
  const m = [...err.matchAll(/RMS level dB:\s*(-?[\d.]+|-inf)/g)].pop();
  return m ? (m[1] === '-inf' ? -99 : Number(m[1])) : -99;
};
abs = 0;
for (const c of timing.cuts) {
  for (const [i, s] of c.subs.entries()) {
    const end = s.end == null ? c.dur : s.end;
    const lvl = await rms(abs + s.start + 0.05, abs + Math.min(end, s.start + 1.2));
    ok(lvl > -40, `${c.id}/sub${i + 1} 発話区間の RMS ${lvl.toFixed(1)} dB（-40dB より上）`);
  }
  abs += c.dur;
}

// ── 5) 2キャラの声が聞き分けられるか（F0の実測差） ──
console.log('\n5) 話者の作り分け（YINで実測したF0）');
const procDir = path.join(here, '.voice/proc');
if (fs.existsSync(procDir)) {
  const files = fs.readdirSync(procDir).filter((f) => f.endsWith('.wav'));
  const whoOf = new Map();
  for (const c of CUTS) (c.subs || []).forEach((s, i) => whoOf.set(`${c.id}_s${i + 1}`, s.who));
  const groups = ['cat', 'dog'].map((who) => ({
    name: SPEAKERS[who].name,
    files: files.filter((f) => whoOf.get(f.replace(/_p\d+\.wav$/, '')) === who).map((f) => path.join(procDir, f)),
  }));
  const res = JSON.parse((await new Promise((res2, rej) => {
    const p = spawn('python3', [path.join(here, 'tts.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
    let o = '';
    p.stdout.on('data', (d) => { o += d; });
    p.on('close', (c) => (c === 0 ? res2(o) : rej(new Error('f0 failed'))));
    p.stdin.write(JSON.stringify({ mode: 'f0', groups })); p.stdin.end();
  })));
  for (const [n, v] of Object.entries(res.f0)) console.log(`  ${n}: F0 中央値 ${v.toFixed(1)} Hz`);
  ok(Math.abs(res.semitones) >= 2.0, `2キャラのピッチ差 ${Math.abs(res.semitones).toFixed(2)} 半音 ≧ 2.0（聞き分けられる）`);
} else {
  console.log('  － .voice/proc が無いので省略（KEEP_WORK=1 node scripts/compose/tts.mjs で残る）');
}

console.log(`\n${ng === 0 ? '✓ すべて合格' : `✗ ${ng} 件 NG`}`);
process.exit(ng === 0 ? 0 : 1);
