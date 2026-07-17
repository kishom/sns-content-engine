# scripts/ — 制作・配信自動化

ネコネコ＆イヌイヌのコンテンツを **台本 → 動画（音声・口パクつき）→ 配信キュー → 予約投稿** まで回すスクリプト群。

**依存:** Node.js 18+（`export.mjs`/`schedule.mjs` は標準のみ）／動画書き出しは `ffmpeg` + `python3`+`Pillow` + macOS（`say` 日本語TTS・日本語フォント）（`render.mjs`）。

**音声と動き:** セリフ（🐱「…」🐶「…」）はmacOSの`say`で読み上げ（ネコ=Kyoko@165ゆっくり／イヌ=Kyoko@235早口。`NEKO_VOICE`/`INU_VOICE`/`NEKO_RATE`/`INU_RATE`で変更可）。話者は口パク＋ぴょこ揺れの2コマアニメ。カット尺は音声に合わせて自動延長される（台本の秒数は下限）。

## ファイル

| ファイル | 役割 |
|---------|------|
| [`build.mjs`](build.mjs) | **1コマンド**で 台本 → 動画＋配信キュー＋マニフェスト（日次ランナー） |
| [`render.mjs`](render.mjs) | 台本(md)の場面テーブル → 9:16 動画(`<name>.mp4`) を書き出し |
| [`_render_card.py`](_render_card.py) | `render.mjs` から呼ばれるカードPNG生成（Pillow・日本語＋ネコネコ/イヌイヌ簡易アバター描画） |
| [`export.mjs`](export.mjs) | 台本(md) → 配信キュー(`queue.json`) を生成 |
| [`schedule.mjs`](schedule.mjs) | `queue.json` を読み、**承認済みなら**予約投稿（現状 dry-run スタブ） |
| [`platforms.config.json`](platforms.config.json) | 各媒体の尺・投稿時間・ハッシュタグ・キャプション方針 |

## 使い方

```bash
# ★ ふだんはこれ1つ：台本 → 動画(mp4) ＋ 配信キュー(queue.json) をまとめて生成
node scripts/build.mjs content/2026-07-02_heatstroke  # 1本
node scripts/build.mjs content/2026-07-02_pad-burn.md # 1本(.md)
node scripts/build.mjs all                            # content/ 配下すべて
#   → 各コンテンツに <name>.mp4 と queue.json、content/build-manifest.json を出力。
#     動画はテロップ大＋セリフ下＋ネコネコ/イヌイヌのアバター（話者をハイライト）。
#     ※ build は投稿しない。投稿は下記の人間レビュー→schedule.mjs。

# 表情：台本の「ビジュアル指示」列のキーワードでカットごとに変わる。
#   ネコネコ: 半目/のんびり/やれやれ/真顔 → 半目、どや → どや顔、心配 → 下がり目、びっくり/驚 → 白目リング
#   イヌイヌ: 笑顔/全力/喜 → 笑い口＋舌、しょんぼり/泣 → 下がり目＋への字＋耳下がる、ハッ/びっくり/注目 → 白目リング
#   「猫が◯◯」「犬が◯◯」と書けばそのキャラだけに効く（→ や 、 で区切る）。

# ── 個別に回す場合 ──
node scripts/render.mjs content/2026-07-02_heatstroke  # 動画だけ
node scripts/export.mjs content/2026-07-02_heatstroke  # 配信キューだけ

# 人間レビュー：エビデンス・断定回避・受診誘導を確認し、
#   生成された queue.json の "reviewApproved" を true にする

# 予約投稿（まず dry-run で確認 → --commit で実行）
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
