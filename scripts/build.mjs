#!/usr/bin/env node
// build.mjs — 1コマンドで「台本 → 動画(mp4) ＋ 配信キュー(queue.json)」をまとめて生成する
// 日次ビルドランナー（docs/workflow.md の 04 自動化の実体）。
//
// 使い方:
//   node scripts/build.mjs content/2026-07-02_heatstroke   # 1本
//   node scripts/build.mjs content/2026-07-02_pad-burn.md  # 1本(.md)
//   node scripts/build.mjs all                              # content/ 配下すべて
//
// 出力: 各コンテンツに <name>.mp4 と queue.json、さらに content/build-manifest.json。
// ※ 投稿はしない。投稿は人間レビュー→ schedule.mjs（承認ゲート）で。

import { execFileSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const contentDir = join(root, "content");

function fail(m) { console.error(`✗ ${m}`); process.exit(1); }

// --- ターゲット解決 ---
const arg = process.argv[2];
if (!arg) fail("使い方: node scripts/build.mjs <content/... | all>");

function discoverAll() {
  const out = [];
  for (const name of readdirSync(contentDir)) {
    if (name.startsWith(".")) continue;
    const p = join(contentDir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (["02-script.md", "script.md"].some((f) => existsSync(join(p, f)))) out.push(p);
    } else if (name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out.sort();
}

const targets = arg === "all" ? discoverAll() : [arg];
if (!targets.length) fail("対象コンテンツが見つかりません");

// 出力ファイル名を render.mjs / export.mjs と同じ規則で解決
function pathsFor(target) {
  const isDir = statSync(target).isDirectory();
  if (isDir) {
    return { video: join(target, basename(target) + ".mp4"), queue: join(target, "queue.json") };
  }
  const d = dirname(target), b = basename(target, ".md");
  return { video: join(d, b + ".mp4"), queue: join(d, b + ".queue.json") };
}

function ffDuration(mp4) {
  try {
    return Number(execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4,
    ]).toString().trim()) || null;
  } catch { return null; }
}

// --- ビルド ---
const manifest = [];
for (const t of targets) {
  const rel = t.replace(root + "/", "");
  console.log(`\n▶ ${rel}`);
  const { video, queue } = pathsFor(t);
  let ok = true;
  try {
    execFileSync("node", [join(__dirname, "render.mjs"), t], { stdio: "inherit" });
    execFileSync("node", [join(__dirname, "export.mjs"), t], { stdio: "inherit" });
  } catch (e) {
    ok = false;
    console.error(`  ✗ ビルド失敗: ${e.message.split("\n")[0]}`);
  }
  let q = {};
  try { q = JSON.parse(execFileSync("cat", [queue]).toString()); } catch {}
  manifest.push({
    source: rel,
    ok,
    title: q.title || basename(t, ".md"),
    video: existsSync(video) ? video.replace(root + "/", "") : null,
    durationSec: existsSync(video) ? ffDuration(video) : null,
    platforms: (q.items || []).map((i) => i.platform),
    reviewApproved: q.reviewApproved ?? false,
  });
}

const manifestPath = join(contentDir, "build-manifest.json");
writeFileSync(manifestPath, JSON.stringify({ builtCount: manifest.length, items: manifest }, null, 2) + "\n");

// --- サマリ ---
console.log("\n=== ビルド結果 ===");
for (const m of manifest) {
  const dur = m.durationSec ? `${Math.round(m.durationSec)}s` : "—";
  const gate = m.reviewApproved ? "承認済✓" : "レビュー待";
  console.log(`  ${m.ok ? "✓" : "✗"} ${m.title.slice(0, 24).padEnd(24)} ${dur.padStart(4)}  [${m.platforms.join(",")}]  ${gate}`);
}
console.log(`\nマニフェスト: ${manifestPath.replace(root + "/", "")}`);
console.log("次: 各 queue.json を人間レビュー→ reviewApproved=true → node scripts/schedule.mjs <queue.json>");
