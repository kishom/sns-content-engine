# cat-ckd — I2V生成プロンプト（Lane B・リール級）

[`../../prompts/06-animate.md`](../../prompts/06-animate.md) の型に従い、02-script.md の**7カット**を変換。
参照画像は `assets/char-ref/` の確定版（ネコネコ／イヌイヌ各表情セット）を使用すること。
**全クリップ無音・静止カメラで生成**（音声はVOICEVOX後付け／ズーム等の演出はffmpeg側で後掛け＝クリップは常にループ延長可能に保つ）／9:16／上部テロップ余白。

## 共通節（全カット先頭に連結）

```
adorable soft 3D character animation, gentle smooth squishy motion with subtle squash-and-stretch,
matte clay-vinyl toy texture with a subtle velvety fuzz, soft studio lighting, pastel colors,
the characters keep EXACTLY the same design, colors, markings and texture as the reference image,
clean minimal 3D background with soft depth of field, vertical 9:16,
empty space at the top for caption text, no text, no watermark,
static camera, ends in a loopable gentle idle motion
```

2キャラ同時カットの配置節:

```
Nekoneko the cream cat mascot stays on the LEFT (gray patch on ITS left ear/head),
Inuinu the tan dog mascot stays on the RIGHT (dark-brown floppy ears),
characters do not swap positions or mirror
```

## カット別プロンプト

| カット | 参照画像 | 動作節（共通・配置節に続けて連結） | 尺 | リテイク条件 |
|--------|----------|----------------------------------|-----|--------------|
| cut-01 (0-3s) | neko+inu | `Inuinu bounces up and down happily pointing at a water bowl beside Nekoneko, tail wagging fast, sparkles around; Nekoneko gives an unimpressed flat half-lidded look toward the viewer. cozy living room background, a simple ceramic water bowl on the floor` | 4s | 柄反転／位置入替／水皿が複数化 |
| cut-02 (3-7s) | neko solo | `a simple ceramic water bowl in the foreground, Nekoneko beside it swaying gently side to side, relaxed half-lidded eyes, slow blink. soft plain pastel background` | 5s | 目の崩れ／余計な文字／水皿が複数化 |
| cut-03 (7-12s) | neko+inu | `Inuinu suddenly perks up with wide surprised eyes, ears flap once, small bounce; Nekoneko leans slightly forward, serious calm face, one small emphatic paw tap. soft plain pastel background` | 6s | 柄反転／位置入替（強調ズームはffmpeg後掛け） |
| cut-04 (12-19s) | neko solo | `Nekoneko raises one stubby paw as if explaining, confident knowing smile, slight head tilt. soft plain pastel background` | 6s | 目の崩れ／余計な文字 |
| cut-05 (19-27s) | neko+inu | `Inuinu perks up with wide surprised eyes and a small bounce; Nekoneko calmly counts on its stubby paw with a confident smile, three small pastel icons (a water bowl, a litter box, a weighing scale) floating gently beside them` | 7s | アイコンが文字化／水系アイコンが2個に重複したらNG |
| cut-06 (27-33s) | neko+inu | `Nekoneko sways gently side to side, relaxed half-lidded eyes, slow blink; Inuinu nods slowly twice with an understanding expression. warm clinic-like soft background with a soft green pastel cross icon` | 6s | **赤い十字は色味違いでも不可（赤十字標章）— 緑/パステルのみ**／注射器等の生々しい医療モチーフNG |
| cut-07 (33-40s) | neko+inu | `both characters bounce softly in sync, happy closed-eye smiles, warm sparkling atmosphere, Inuinu's tail wagging. cozy living room background` | 6s | 柄反転／位置入替 |

> チェックリスト再掲（✅水・✅おしっこ・✅体重）と免責テロップは**合成レイヤーで載せる**（生成画像に文字やアイコン再掲を焼き込まない）。

## 音声（VOICEVOX・後合成）

- ネコネコ = 落ち着き系話者（低め・ゆっくり）／イヌイヌ = 元気系話者（高め・早口）。話者確定後にここへ記名する
- クレジット表記（例: `VOICEVOX:○○`）をキャプション末尾に必ず入れる
- セリフテキストは 02-script.md のセリフ列が正。カット尺は音声長に合わせて伸ばす（クリップ末尾のループ待機動作を延長）
- **cut-01はフック**: 猫の「褒めてる場合じゃないかも」が2.5秒以内に言い終わるよう話速調整（実測必須）

## 合成手順（手動・P1検証）

1. 採用クリップを `cut-01.mp4`〜`cut-07.mp4` で本フォルダに保存
2. ffmpeg で連結 → テロップ（02-scriptのテロップ列）＋セリフ字幕＋チェックリスト再掲＋免責＋音声＋BGM合成 → `-15LUFS` 正規化（現行render.mjsと同基準。シリーズ全体で **-14LUFS** へ移行する場合は render.mjs と本ドキュメントを同時に変更すること＝基準値の分裂禁止）
3. cut-03 の強調は ffmpeg の `zoompan` で軽いズームを後掛け
4. `node scripts/export.mjs content/2026-07-22_cat-ckd` で配信キュー生成
5. 人間レビュー（エビデンス・断定回避・受診誘導）→ `reviewApproved: true` → schedule
