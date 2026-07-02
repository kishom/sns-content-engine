# 05 — VISUAL：AI画像/アニメ生成プロンプト集（ネコネコ＆イヌイヌ）

2キャラの**一貫したビジュアル**を生成するためのプロンプト集。毎回同じ見た目になるよう、共通スタイル + 各キャラの固定特徴 + シーン別を分けて管理する。

> 使い方：`共通スタイル` を土台に、必要なキャラ／シーンのブロックを連結して画像生成AIへ渡す。生成物は各コンテンツフォルダに保存し、採用カットを台本のカット番号に紐づける。

---

## 共通スタイル（全カット共通・毎回付ける）

```
soft cute anime illustration style, gentle pastel color palette, rounded shapes,
warm and healing vibe, clean flat shading, simple background, thick clean outlines,
vertical 9:16 composition, plenty of headroom for caption text at top-center,
high quality, consistent character design
```

**ネガティブ（共通）**
```
realistic photo, horror, scary, distorted anatomy, extra limbs, text artifacts,
watermark, cluttered background, low quality, blurry
```

---

## 🐱 ネコネコ（猫）— 固定特徴

```
a cute cat character named Nekoneko:
cream / light-gray short-haired cat, round face, sleepy half-closed eyes (relaxed cool expression),
small rounded ears, soft cheeks, compact rounded body, calm and knowledgeable vibe,
the "smart calm one" of the duo
```

**表情バリエーション**
- のんびり: `relaxed half-lidded eyes, slight smile`
- どや顔（解説）: `confident knowing smile, one paw raised as if explaining`
- 心配: `worried eyes, slightly tilted head`
- やれやれ: `unimpressed flat expression, small sigh`

## 🐶 イヌイヌ（犬）— 固定特徴

```
a cute dog character named Inuinu:
light-brown / tan floppy-eared dog, round friendly face, big bright round eyes,
wagging curled tail, energetic and cheerful expression, tongue slightly out,
a bit clumsy and enthusiastic, the "energetic goofy one" of the duo
```

**表情バリエーション**
- 満面の笑み: `huge happy smile, sparkling eyes, tongue out`
- 全力ダッシュ: `running with motion lines, ears flapping`
- しょんぼり: `droopy ears, teary eyes, sad`
- ハッと気づき: `surprised wide eyes, exclamation feel`

---

## シーン別（掛け合い構図）

同一フレームに2キャラを置く場合、**判別しやすいシルエット**（猫＝丸め半目 / 犬＝垂れ耳ふり尾）を保つ。

- **ツッコミ構図:** `Inuinu excited on the left, Nekoneko calmly stopping him with a raised paw on the right, vertical 9:16`
- **解説構図:** `Nekoneko explaining with a confident smile pointing at a big number/label, Inuinu listening with surprised eyes, space at top for caption`
- **並び（サムネ/カバー）:** `Nekoneko and Inuinu side by side smiling at viewer, matching art style, cover-friendly composition`
- **心配→安心:** `both looking a little worried then relieved, gentle healing atmosphere`

## 一貫性のコツ

- キャラ固定特徴ブロックは**毎回丸ごとコピペ**（毛色・耳・目・体型を変えない）。
- シード固定 / 参照画像（img2img・キャラ参照）が使えるツールでは、確定した1枚を基準画像に。
- 9:16でテロップ用に**上部の余白**を必ず確保。顔がテロップで隠れないように。
- 色は [`../docs/character.md`](../docs/character.md) の「やわらかい配色」に合わせる。

## 出力の保存

- 生成カットは対象コンテンツのフォルダ（例: `../content/2026-07-02_heatstroke/`）に保存。
- ファイル名で台本カットに対応づけ（例: `cut-01_hook.png`, `cut-03_explain.png`）。
