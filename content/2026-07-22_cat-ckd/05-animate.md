# cat-ckd — I2V生成プロンプト（Lane B・リール級）

[`../../prompts/06-animate.md`](../../prompts/06-animate.md) の型に従い、02-script.md の7カット（フック含む6場面）を変換。
参照画像は `assets/char-ref/` の確定版（ネコネコ／イヌイヌ各表情セット）を使用すること。
**全クリップ無音で生成**（音声はVOICEVOX後付け）／9:16／上部テロップ余白。

## 共通節（全カット先頭に連結）

```
soft cute 2D mascot animation, gentle smooth motion, flat pastel colors,
the characters keep EXACTLY the same design, colors and markings as the reference image,
simple clean background, vertical 9:16, empty space at the top for caption text,
no text, no watermark
```

2キャラ同時カットの配置節:

```
Nekoneko the cream cat mascot stays on the LEFT (gray patch on ITS left ear/head),
Inuinu the tan dog mascot stays on the RIGHT (dark-brown floppy ears),
characters do not swap positions or mirror
```

## カット別プロンプト

| カット | 参照画像 | 動作＋カメラ節（共通・配置節に続けて連結） | 尺 | リテイク条件 |
|--------|----------|------------------------------------------|-----|--------------|
| cut-01 | neko+inu | `Inuinu bounces up and down happily pointing at a water bowl beside Nekoneko, tail wagging fast, sparkles around; Nekoneko gives an unimpressed flat half-lidded look toward the viewer. cozy living room background, a simple ceramic water bowl on the floor. static camera` | 5s | 柄反転／位置入替／水皿が複数化 |
| cut-02 | neko solo | `Nekoneko leans slightly forward toward the viewer, serious calm face, one small emphatic paw tap; a small water bowl beside it. soft plain pastel background. slow gentle zoom in` | 6s | 目の崩れ／余計な文字 |
| cut-03 | neko+inu | `Nekoneko raises one stubby paw as if explaining, confident knowing smile, slight head tilt; Inuinu perks up in surprise, ears flap once, wide eyes. soft plain pastel background. static camera` | 6s | 柄反転／位置入替 |
| cut-04 | neko+inu | `Inuinu suddenly perks up with wide surprised eyes and a small bounce; Nekoneko calmly counts on its stubby paw with a confident smile, three small pastel icons (water drop, droplet, scale) floating gently beside them. static camera` | 6s | アイコンが文字化したらNG |
| cut-05 | neko+inu | `Nekoneko sways gently side to side, relaxed half-lidded eyes, slow blink; Inuinu nods slowly twice with an understanding expression. warm clinic-like soft background with a pastel cross icon. static camera` | 6s | 医療っぽさが強すぎる背景（注射器等）はNG |
| cut-06 | neko+inu | `both characters bounce softly in sync, happy closed-eye smiles, warm sparkling atmosphere, Inuinu's tail wagging. cozy living room background. static camera` | 6s | 柄反転／位置入替 |

## 音声（VOICEVOX・後合成）

- ネコネコ = 落ち着き系話者（低め・ゆっくり）／イヌイヌ = 元気系話者（高め・早口）。話者確定後にここへ記名する
- クレジット表記（例: `VOICEVOX:○○`）をキャプション末尾に必ず入れる
- セリフテキストは 02-script.md のセリフ列が正。カット尺は音声長に合わせて伸ばす（クリップ末尾はループ可能な待機動作）

## 合成手順（手動・P1検証）

1. 採用クリップを `cut-01.mp4`〜`cut-06.mp4` で本フォルダに保存
2. ffmpeg で連結 → テロップ（02-scriptのテロップ列）＋セリフ字幕＋音声＋BGM合成 → `-15LUFS` 正規化
3. `node scripts/export.mjs content/2026-07-22_cat-ckd` で配信キュー生成
4. 人間レビュー（エビデンス・断定回避・受診誘導）→ `reviewApproved: true` → schedule
