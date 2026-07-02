#!/usr/bin/env node
// schedule.mjs — export.mjs が作った queue.json を読み、レビュー承認済みなら
// 各プラットフォームへ予約投稿する（現状は dry-run スタブ）。
//
// 【安全設計】医療コンテンツのため、queue.json の reviewApproved が true
// でない限り絶対に投稿しない（README / docs/workflow.md の承認ゲート）。
//
// 使い方:
//   node scripts/schedule.mjs content/2026-07-02_heatstroke/queue.json           # dry-run
//   node scripts/schedule.mjs content/2026-07-02_heatstroke/queue.json --commit  # 実投稿
//
// 実投稿を有効化するには、各 postXxx() に各プラットフォームのAPI呼び出しを実装し、
// 認証情報は環境変数で渡す（例: IG_ACCESS_TOKEN, TIKTOK_TOKEN 等）。トークンはコミットしない。

import { readFileSync } from "node:fs";

const file = process.argv[2];
const commit = process.argv.includes("--commit");
if (!file) {
  console.error("使い方: node scripts/schedule.mjs <queue.json> [--commit]");
  process.exit(1);
}

const queue = JSON.parse(readFileSync(file, "utf8"));

// --- 承認ゲート ---
if (queue.reviewGateRequired && !queue.reviewApproved) {
  console.error("✗ レビュー未承認です（reviewApproved=false）。");
  console.error("  台本のエビデンス・断定回避・受診誘導を確認し、");
  console.error("  queue.json の reviewApproved を true にしてから再実行してください。");
  process.exit(2);
}

// --- プラットフォーム別 投稿関数（スタブ） ---
async function postInstagramReels(item) {
  // TODO: Instagram Graph API (Content Publishing) を実装。IG_ACCESS_TOKEN を使用。
  return stub("instagram_reels", item);
}
async function postTikTok(item) {
  // TODO: TikTok Content Posting API を実装。TIKTOK_TOKEN を使用。
  return stub("tiktok", item);
}
async function postYouTubeShorts(item) {
  // TODO: YouTube Data API v3 (videos.insert) を実装。YT_OAUTH を使用。
  return stub("youtube_shorts", item);
}
async function postLineVoom(item) {
  // TODO: LINE VOOM 対応時に実装。
  return stub("line_voom", item);
}

function stub(name, item) {
  const mode = commit ? "COMMIT(未実装のためスキップ)" : "DRY-RUN";
  console.log(`  [${mode}] ${name} @${item.postTimeJST}JST / ${item.durationSec}s`);
  console.log(`    caption: ${item.caption.split("\n")[0]} …`);
  return { platform: name, scheduled: false, reason: commit ? "API未実装" : "dry-run" };
}

const dispatch = {
  instagram_reels: postInstagramReels,
  tiktok: postTikTok,
  youtube_shorts: postYouTubeShorts,
  line_voom: postLineVoom,
};

console.log(`▶ ${queue.title}`);
console.log(`  レビュー: ${queue.reviewApproved ? "承認済み ✓" : "不要"}`);

for (const item of queue.items) {
  const fn = dispatch[item.platform];
  if (!fn) { console.log(`  ? 未知のプラットフォーム: ${item.platform}`); continue; }
  await fn(item);
}

console.log(
  commit
    ? "\n※ 実投稿APIは未実装（スタブ）。各 postXxx() を実装してください。"
    : "\n※ dry-run 完了。実投稿は --commit（要API実装）。",
);
