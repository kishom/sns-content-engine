#!/usr/bin/env node
// export.mjs — 1本のコンテンツ台本(md)から、各プラットフォーム向けの
// 書き出し仕様＋キャプション＋ハッシュタグを生成し、配信キュー(JSON)を出力する。
//
// 依存ゼロ（Node標準のみ）。実際の動画レンダリング/投稿は行わず、
// 「何を・どの尺で・どのキャプションで・いつ出すか」の配信プランを組み立てる。
//
// 使い方:
//   node scripts/export.mjs content/2026-07-02_heatstroke
//   node scripts/export.mjs content/2026-07-02_pad-burn.md
//
// 出力: 対象フォルダ（または同名フォルダ）内に queue.json を生成。

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  readFileSync(join(__dirname, "platforms.config.json"), "utf8"),
);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// --- 入力パス解決：フォルダなら 02-script.md / *.md を探す ---
const target = process.argv[2];
if (!target) fail("使い方: node scripts/export.mjs <content/フォルダ or .md>");

let scriptPath, outDir;
const st = statSync(target);
if (st.isDirectory()) {
  outDir = target;
  const cand =
    ["02-script.md", "script.md"].find((f) => {
      try { return statSync(join(target, f)).isFile(); } catch { return false; }
    }) || readdirSync(target).find((f) => f.endsWith(".md"));
  if (!cand) fail(`台本(.md)が見つかりません: ${target}`);
  scriptPath = join(target, cand);
} else {
  scriptPath = target;
  outDir = null; // ルーズな .md は <同ディレクトリ>/<basename>.queue.json に出す
}

const md = readFileSync(scriptPath, "utf8");

// --- 台本から緩く情報抽出（見出し・尺・テーマ） ---
const title = (md.match(/^#\s+(.+)$/m)?.[1] || basename(scriptPath, ".md"))
  .replace(/^\d+\s+\S+\s*出力\s*[—―-]\s*/, "") // 「02 SCRIPT 出力 — 」等の工程ラベルを除去
  .trim();
const durationSec =
  Number(md.match(/尺[^\d]*?約?(\d+)\s*秒/)?.[1]) || 40;
// 台本内のテーマ別ハッシュタグ（配信メモの "ハッシュタグ:" 行）を拾う
const topicTags =
  (md.match(/ハッシュタグ[:：]\s*(.+)/)?.[1] || "")
    .split(/[\s,、]+/)
    .filter((t) => t.startsWith("#"));

// --- キャプション組み立て ---
function buildCaption(pf) {
  const tags = [...new Set([...topicTags, ...pf.hashtags])].join(" ");
  const hook = md.match(/\*\*テロップ[:：]\*\*\s*(.+)/)?.[1]
    || md.match(/フック[（(]3秒[)）][^\n]*\n[^\n]*[「『](.+?)[」』]/)?.[1]
    || title;
  return [
    `【保存推奨】${hook}`,
    `${title} をネコネコ＆イヌイヌが解説🐱🐶`,
    "※症状や対応は犬猫・個体差があります。判断はかかりつけの獣医師へ。",
    tags,
  ].join("\n");
}

// --- 各プラットフォームの書き出し仕様を作る ---
const items = [];
for (const [key, pf] of Object.entries(config.platforms)) {
  if (!pf.enabled) continue;
  const clipped = Math.min(durationSec, pf.maxDurationSec);
  items.push({
    platform: key,
    aspectRatio: config.aspectRatio,
    durationSec: clipped,
    truncated: clipped < durationSec,
    postTimeJST: pf.postTimeJST,
    captionStyle: pf.captionStyle,
    caption: buildCaption(pf),
    status: "draft", // review ゲート通過後に "queued" へ
  });
}

const queue = {
  title,
  source: scriptPath,
  reviewGateRequired: config.reviewGateRequired,
  reviewApproved: false, // ← schedule.mjs はこれが true でないと投稿しない
  generatedAtNote: "生成時刻は git のコミット時刻を正とする（この環境では時刻APIを使わない）",
  items,
};

const outPath = outDir
  ? join(outDir, "queue.json")
  : join(dirname(scriptPath), basename(scriptPath, ".md") + ".queue.json");
writeFileSync(outPath, JSON.stringify(queue, null, 2) + "\n");

console.log(`✓ 書き出し: ${outPath}`);
console.log(`  テーマ: ${title} / 尺: ${durationSec}s`);
console.log(`  対象: ${items.map((i) => i.platform).join(", ")}`);
if (config.reviewGateRequired) {
  console.log(
    "  ⚠️ reviewApproved=false。人間レビュー後に true にしてから schedule.mjs を実行してください。",
  );
}
