# scripts/ — 制作・配信自動化

ネコネコ＆イヌイヌのコンテンツを **台本 → 動画 → 配信キュー → 予約投稿** まで回すスクリプト群。

**依存:** Node.js 18+（`export.mjs`/`schedule.mjs` は標準のみ）／動画書き出しは `ffmpeg` + `python3`+`Pillow` + macOS 日本語フォント（`render.mjs`）。

## ファイル

| ファイル | 役割 |
|---------|------|
| [`render.mjs`](render.mjs) | 台本(md)の場面テーブル → 9:16 動画(`<name>.mp4`) を書き出し |
| [`_render_card.py`](_render_card.py) | `render.mjs` から呼ばれるカードPNG生成（Pillow・日本語描画） |
| [`export.mjs`](export.mjs) | 台本(md) → 配信キュー(`queue.json`) を生成 |
| [`schedule.mjs`](schedule.mjs) | `queue.json` を読み、**承認済みなら**予約投稿（現状 dry-run スタブ） |
| [`platforms.config.json`](platforms.config.json) | 各媒体の尺・投稿時間・ハッシュタグ・キャプション方針 |

## 使い方

```bash
# 0) 台本から動画(mp4)を書き出し（フォルダ or .md を指定）
node scripts/render.mjs content/2026-07-02_heatstroke
node scripts/render.mjs content/2026-07-02_pad-burn.md
#   → 台詞テーブルの各カットを尺どおりに、テロップ大＋セリフ下のパステルカードで連結。
#     キャラ画像は prompts/05-visual.md で生成後に差し込む想定（現状はテキストカード）。

# 1) 台本から配信キューを生成（フォルダ or .md を指定）
node scripts/export.mjs content/2026-07-02_heatstroke
node scripts/export.mjs content/2026-07-02_pad-burn.md

# 2) 人間レビュー：エビデンス・断定回避・受診誘導を確認し、
#    生成された queue.json の "reviewApproved" を true にする

# 3) 予約投稿（まず dry-run で確認）
node scripts/schedule.mjs content/2026-07-02_heatstroke/queue.json
node scripts/schedule.mjs content/2026-07-02_heatstroke/queue.json --commit
```

> 生成される `*.mp4` / `*.png` / `queue.json` は再生成可能なため `.gitignore` 済み。

## ⚠️ 承認ゲート（重要）

医療コンテンツのため、`schedule.mjs` は `queue.json` の `reviewApproved` が `true` でない限り**絶対に投稿しません**。人間レビュー（[`../docs/workflow.md`](../docs/workflow.md) の 04 承認ゲート）を必ず通してください。

## 実投稿の実装

`schedule.mjs` の `postInstagramReels` / `postTikTok` / `postYouTubeShorts` / `postLineVoom` は現在スタブです。各プラットフォームAPIを実装し、認証情報は**環境変数**で渡してください（例: `IG_ACCESS_TOKEN`, `TIKTOK_TOKEN`, `YT_OAUTH`）。**トークンはコミットしないこと。**

- Instagram: Graph API Content Publishing
- TikTok: Content Posting API
- YouTube: Data API v3 `videos.insert`
- LINE VOOM: 対応可能になり次第
