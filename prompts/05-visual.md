# 05 — VISUAL：AI画像/アニメ生成プロンプト集（ネコネコ＆イヌイヌ）

2キャラの**一貫したビジュアル**を生成するためのプロンプト集。毎回同じ見た目になるよう、共通スタイル + 各キャラの固定特徴 + シーン別を分けて管理する。

> **デザイン確定（2026-07-05）**：スタイルは「もちもち豆マスコット・ぶち模様」（案B-4）。
> 豆型（bean/mochi）の2頭身ボディ＋**柄で個体識別**（ネコ=灰ぶち耳＋頭・体の斑 / イヌ=こげ茶垂れ耳＋まゆ点＋背中の柄）。
> 柄は言語で指定できるため、AI生成のキャラ一貫性の生命線。**絶対に省略・変更しない。**

> 使い方：`共通スタイル` を土台に、必要なキャラ／シーンのブロックを連結して画像生成AIへ渡す。生成物は各コンテンツフォルダに保存し、採用カットを台本のカット番号に紐づける。

---

## 共通スタイル（全カット共通・毎回付ける）

```
soft cute mascot illustration style, chibi bean-shaped (mochi-like) body, no neck,
head and body merged into one plump rounded form, tiny stubby paws,
gentle pastel color palette, thick clean dark-brown outlines (#4A3B2A),
flat shading, pink blush cheeks, simple background,
vertical 9:16 composition, plenty of headroom for caption text at top-center,
high quality, consistent character design, sticker-like charm
```

**ネガティブ（共通）**
```
realistic photo, realistic fur texture, long neck, slender body, human proportions,
horror, scary, distorted anatomy, extra limbs, text artifacts,
watermark, cluttered background, low quality, blurry
```

---

## 🐱 ネコネコ（猫）— 固定特徴【確定・毎回丸ごとコピペ】

```
Nekoneko, a cream-colored (#EFE9DF) bean-shaped mochi cat mascot:
- LEFT ear and a patch over the left side of the head are grayish-buff (#BFB4A4)
- one small grayish-buff oval spot on the lower right of the body
- small triangular ears, simple black dot eyes, tiny pink triangle nose, cat "ω" mouth
- pink blush circles on both cheeks
- tiny stubby paws at the bottom, curled tail on the right side
- calm, relaxed, knowledgeable vibe — the "smart calm one" of the duo
```

**柄の覚え方**：左耳グレー＋左頭ぶち＋右下ボディに斑1つ。（左右が反転しないよう構図指定と併記する）

**表情バリエーション**
- のんびり: `relaxed half-lidded eyes, slight smile`
- どや顔（解説）: `confident knowing smile, one stubby paw raised as if explaining`
- 心配: `worried curved eyes, slightly tilted body`
- やれやれ: `unimpressed flat half-lidded expression`

## 🐶 イヌイヌ（犬）— 固定特徴【確定・毎回丸ごとコピペ】

```
Inuinu, a tan-colored (#E4C9A0) bean-shaped mochi dog mascot:
- dark-brown (#8F6B44) floppy drooping ears on both sides
- two small dark eyebrow dots above the eyes
- one light-brown (#C6A880) oval patch on the lower left of the body/back
- simple black round dot eyes, dark oval nose, open happy smile
- pink blush circles on both cheeks
- tiny stubby paws at the bottom, small wagging tail on the left side
- energetic, cheerful, a bit clumsy — the "energetic goofy one" of the duo
```

**柄の覚え方**：両耳こげ茶＋まゆ点2つ＋左下ボディに柄1つ。

**表情バリエーション**
- 満面の笑み: `huge happy open-mouth smile, sparkling dot eyes, tongue out`
- 全力: `bouncing with small motion lines, ears flapping`
- しょんぼり: `ears drooping lower, teary dot eyes, sad`
- ハッと気づき: `wide surprised eyes, small exclamation feel`

---

## シーン別（掛け合い構図）

同一フレームに2キャラを置く場合、**柄とシルエットで判別**（猫＝三角耳・灰ぶち / 犬＝こげ茶垂れ耳・まゆ点）を保つ。基本配置は **ネコネコ左・イヌイヌ右**（柄の左右反転事故を防ぐため毎回明記）。

- **ツッコミ構図:** `Inuinu bouncing excitedly on the right, Nekoneko calmly stopping him with a raised stubby paw on the left, vertical 9:16`
- **解説構図:** `Nekoneko on the left explaining with a confident smile, Inuinu on the right listening with surprised eyes, space at top for caption`
- **並び（サムネ/カバー）:** `Nekoneko (left) and Inuinu (right) side by side smiling at viewer, matching mascot style, cover-friendly composition`
- **心配→安心:** `both looking a little worried then relieved, gentle healing atmosphere`

## 一貫性のコツ

- キャラ固定特徴ブロックは**毎回丸ごとコピペ**（毛色・柄・耳・目・体型を変えない）。特に柄（灰ぶち耳/こげ茶耳/まゆ点/体の斑）は識別子なので省略しない。
- **左右の指定を必ず入れる**（ネコ左・イヌ右、ネコの柄は左耳側）。生成AIは左右を反転しがち。
- シード固定 / 参照画像（img2img・キャラ参照）が使えるツールでは、確定した1枚を基準画像に。
- 9:16でテロップ用に**上部の余白**を必ず確保。顔がテロップで隠れないように。
- 色は本ファイルのHEX（#EFE9DF/#BFB4A4/#E4C9A0/#8F6B44/#C6A880/#4A3B2A）を正とする。

## 出力の保存

- 生成カットは対象コンテンツのフォルダ（例: `../content/2026-07-02_heatstroke/`）に保存。
- ファイル名で台本カットに対応づけ（例: `cut-01_hook.png`, `cut-03_explain.png`）。
