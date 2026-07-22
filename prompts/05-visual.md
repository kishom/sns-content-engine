# 05 — VISUAL：AI画像/3D生成プロンプト集（ネコネコ＆イヌイヌ）

2キャラの**一貫したビジュアル**を生成するためのプロンプト集。毎回同じ見た目になるよう、共通スタイル + 各キャラの固定特徴 + シーン別を分けて管理する。

> **デザイン改訂（2026-07-22）**：レンダリングを**「ふわもち3Dトイ」スタイル**に転換（日本＋海外の両市場でバズを狙う指示による）。
> 2頭身の豆型シルエット・カラー・**柄による個体識別**（ネコ=灰ぶち左耳＋頭・右下の斑 / イヌ=こげ茶垂れ耳＋まゆ点＋左下背中の柄）は**旧2D版（案B-4）から完全継承**。柄は言語で指定できるため、AI生成のキャラ一貫性の生命線。**絶対に省略・変更しない。**
> 狙う質感＝**「棚に飾りたくなるデザイナーズトイ」**（モルカーのやわらかさ × ソフビ/クレイトイの立体感）。ぬいぐるみ実物化・グッズ展開まで見据えた造形。
> 旧2Dフラット版のプロンプトは git 履歴（2026-07-21以前）参照。

> 使い方：`共通スタイル` を土台に、必要なキャラ／シーンのブロックを連結して画像生成AIへ渡す。生成物は各コンテンツフォルダに保存し、採用カットを台本のカット番号に紐づける。

---

## 共通スタイル（全カット共通・毎回付ける）

```
adorable soft 3D character render, chibi bean-shaped (mochi-like) body, no neck,
head and body merged into one plump rounded squishy form, tiny stubby paws,
matte clay-vinyl designer toy texture with a subtle velvety fuzz (like a soft plush figurine),
subsurface scattering, gentle soft studio lighting, soft contact shadows,
pastel color palette, clean minimal 3D background with soft depth of field,
Pixar-like cuteness but simple Japanese mascot face (dot eyes, tiny mouth),
vertical 9:16 composition, plenty of headroom for caption text at top-center,
high quality 3D render, consistent character design, collectible toy charm
```

**ネガティブ（共通）**
```
2D flat illustration, outlines, cel shading, cartoon line art,
realistic animal anatomy, realistic fur simulation, long neck, slender body, human proportions,
big humanlike eyes, uncanny, horror, scary, distorted anatomy, extra limbs,
cheap glossy plastic shine, text artifacts, watermark, cluttered background, low quality, blurry
```

> 質感キーワードの意図: **matte clay-vinyl + velvety fuzz** = ソフビとぬいぐるみの中間。テカテカのプラ質感は避ける。「さわりたくなる」が世界共通のバズ因子。

---

## 🐱 ネコネコ（猫）— 固定特徴【確定・毎回丸ごとコピペ】

```
Nekoneko, a cream-colored (#EFE9DF) bean-shaped mochi cat mascot in soft 3D:
- LEFT ear and a patch over the left side of the head are grayish-buff (#BFB4A4)
- one small grayish-buff oval spot on the lower right of the body
- small rounded triangular ears, simple black dot eyes, tiny pink triangle nose, cat "ω" mouth
- soft pink blush on both cheeks
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
Inuinu, a tan-colored (#E4C9A0) bean-shaped mochi dog mascot in soft 3D:
- dark-brown (#8F6B44) floppy drooping ears on both sides
- two small dark eyebrow dots above the eyes
- one light-brown (#C6A880) oval patch on the lower left of the body/back
- simple black round dot eyes, dark oval nose, open happy smile
- soft pink blush on both cheeks
- tiny stubby paws at the bottom, small wagging tail on the left side
- energetic, cheerful, a bit clumsy — the "energetic goofy one" of the duo
```

**柄の覚え方**：両耳こげ茶＋まゆ点2つ＋左下ボディに柄1つ。

**表情バリエーション**
- 満面の笑み: `huge happy open-mouth smile, sparkling dot eyes, tongue out`
- 全力: `bouncing with soft squash-and-stretch, ears flapping`
- しょんぼり: `ears drooping lower, teary dot eyes, sad`
- ハッと気づき: `wide surprised dot eyes, small exclamation feel`

---

## シーン別（掛け合い構図）

同一フレームに2キャラを置く場合、**柄とシルエットで判別**（猫＝三角耳・灰ぶち / 犬＝こげ茶垂れ耳・まゆ点）を保つ。基本配置は **ネコネコ左・イヌイヌ右**（柄の左右反転事故を防ぐため毎回明記）。

- **ツッコミ構図:** `Inuinu bouncing excitedly on the right, Nekoneko calmly stopping him with a raised stubby paw on the left, vertical 9:16`
- **解説構図:** `Nekoneko on the left explaining with a confident smile, Inuinu on the right listening with surprised eyes, space at top for caption`
- **並び（サムネ/カバー）:** `Nekoneko (left) and Inuinu (right) side by side smiling at viewer, matching soft 3D toy style, cover-friendly composition`
- **心配→安心:** `both looking a little worried then relieved, gentle healing atmosphere`

## 一貫性のコツ（3D版）

- キャラ固定特徴ブロックは**毎回丸ごとコピペ**（毛色・柄・耳・目・体型を変えない）。特に柄（灰ぶち耳/こげ茶耳/まゆ点/体の斑）は識別子なので省略しない。
- **左右の指定を必ず入れる**（ネコ左・イヌ右、ネコの柄は左耳側）。生成AIは左右を反転しがち。3Dは体を回すと柄の見え方が変わるため、**基準アングルは正面〜やや斜め（3/4ビュー）に固定**する。
- **質感のブレに注意**: カットごとに「ソフビ寄り」「ぬいぐるみ寄り」に振れやすい。`matte clay-vinyl texture with a subtle velvety fuzz` を省略しない。glossy（テカり）が出たらリテイク。
- **目は必ずシンプルな点目**。3D生成はPixar風の大きい目に寄せてくる（uncannyの入口）。ネガティブの `big humanlike eyes` を省略しない。
- シード固定 / 参照画像（img2img・キャラ参照）が使えるツールでは、確定した1枚を基準画像に。**表情・アングル違いを最初に6〜8枚生成して `assets/char-ref/` に確定保存**し、以後の全生成はそこから。
- 9:16でテロップ用に**上部の余白**を必ず確保。顔がテロップで隠れないように。
- 色は本ファイルのHEX（#EFE9DF/#BFB4A4/#E4C9A0/#8F6B44/#C6A880）を正とする（3D化に伴い旧アウトライン色 #4A3B2A は廃止）。

## 出力の保存

- 生成カットは対象コンテンツのフォルダ（例: `../content/2026-07-22_cat-ckd/`）に保存。
- ファイル名で台本カットに対応づけ（例: `cut-01_hook.png`, `cut-03_explain.png`）。
