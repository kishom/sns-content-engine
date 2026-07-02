# scripts/ — 配信自動化

ネコネコ＆イヌイヌのコンテンツを各プラットフォームへ書き出し・予約投稿するためのスクリプト。依存ゼロ（Node標準のみ、要 Node.js 18+）。

## ファイル

| ファイル | 役割 |
|---------|------|
| [`platforms.config.json`](platforms.config.json) | 各媒体の尺・投稿時間・ハッシュタグ・キャプション方針 |
| [`export.mjs`](export.mjs) | 台本(md) → 配信キュー(`queue.json`) を生成 |
| [`schedule.mjs`](schedule.mjs) | `queue.json` を読み、**承認済みなら**予約投稿（現状 dry-run スタブ） |

## 使い方

```bash
# 1) 台本から配信キューを生成（フォルダ or .md を指定）
node scripts/export.mjs content/2026-07-02_heatstroke
node scripts/export.mjs content/2026-07-02_pad-burn.md

# 2) 人間レビュー：エビデンス・断定回避・受診誘導を確認し、
#    生成された queue.json の "reviewApproved" を true にする

# 3) 予約投稿（まず dry-run で確認）
node scripts/schedule.mjs content/2026-07-02_heatstroke/queue.json
node scripts/schedule.mjs content/2026-07-02_heatstroke/queue.json --commit
```

## ⚠️ 承認ゲート（重要）

医療コンテンツのため、`schedule.mjs` は `queue.json` の `reviewApproved` が `true` でない限り**絶対に投稿しません**。人間レビュー（[`../docs/workflow.md`](../docs/workflow.md) の 04 承認ゲート）を必ず通してください。

## 実投稿の実装

`schedule.mjs` の `postInstagramReels` / `postTikTok` / `postYouTubeShorts` / `postLineVoom` は現在スタブです。各プラットフォームAPIを実装し、認証情報は**環境変数**で渡してください（例: `IG_ACCESS_TOKEN`, `TIKTOK_TOKEN`, `YT_OAUTH`）。**トークンはコミットしないこと。**

- Instagram: Graph API Content Publishing
- TikTok: Content Posting API
- YouTube: Data API v3 `videos.insert`
- LINE VOOM: 対応可能になり次第
