# 06 — ANIMATE：カット→I2V動画生成プロンプト変換（ネコネコ＆イヌイヌ）

台本（02-script）のシーン割りを、**画像→動画（I2V）生成用のモーションプロンプト**に変換するテンプレート。
キャラの見た目は**参照画像（キャラ基準画像）が担保**し、プロンプトは**動きと感情だけ**を記述する。

> 前提: [`05-visual.md`](05-visual.md) で確定したキャラ基準画像（`assets/char-ref/`）を必ず参照画像として添付する。
> 設計全体は [`../docs/ai-video-quality.md`](../docs/ai-video-quality.md) を参照。

---

## 変換ルール

台本の1行（時間｜セリフ｜テロップ｜ビジュアル指示）→ 1クリップ。

```
[入力] 参照画像: char-ref のキャラ画像（1〜2体）
[入力] モーションプロンプト = 共通スタイル節 + 配置節 + 動作節 + カメラ節
[出力] 5〜8秒 / 9:16 / 無音クリップ（音声はVOICEVOX後付け）
```

### 共通スタイル節（毎カット付ける）

```
soft cute 2D mascot animation, gentle smooth motion, flat pastel colors,
the characters keep EXACTLY the same design, colors and markings as the reference image,
simple clean background, vertical 9:16, empty space at the top for caption text,
no text, no watermark, loopable gentle idle motion
```

### 配置節（2キャラ同時のとき・毎回明記）

```
Nekoneko the cream cat mascot stays on the LEFT (gray patch on ITS left ear/head),
Inuinu the tan dog mascot stays on the RIGHT (dark-brown floppy ears),
characters do not swap positions or mirror
```

### 動作節（ビジュアル指示 → 動作語彙）

**1カット=1アクション。** 複合動作（歩きながら振り向く等）は崩れるので分割する。

| 台本の「ビジュアル指示」 | I2V動作プロンプト例 |
|---|---|
| 犬がびっくり／ハッ | `Inuinu suddenly perks up, ears flap once, small bounce of surprise, wide eyes` |
| 犬が全力で喜ぶ | `Inuinu bounces up and down happily, tail wagging fast, sparkles around` |
| 犬がしょんぼり | `Inuinu's ears droop slowly, body deflates a little, teary eyes` |
| 犬がこくり／納得 | `Inuinu nods slowly twice, understanding expression` |
| 猫がのんびり | `Nekoneko sways gently side to side, relaxed half-lidded eyes, slow blink` |
| 猫がどや顔で解説 | `Nekoneko raises one stubby paw as if explaining, confident smile, slight head tilt` |
| 猫が真顔で強調 | `Nekoneko leans slightly forward, serious calm face, small emphatic paw tap` |
| 猫が心配 | `Nekoneko tilts body, worried curved eyes, tail curls tighter` |
| 2人で笑顔 | `both characters bounce softly in sync, happy closed-eye smiles, warm atmosphere` |

### カメラ節（基本は固定・使っても1種）

```
static camera            … 基本これ（マスコット寸劇はカメラを動かさない方が可愛い）
slow gentle zoom in      … 強調カット（受診レベル等の要点）のみ
```

---

## 出力テーブルの型（コンテンツフォルダに保存）

台本と同じフォルダに `05-animate.md` として保存する：

```markdown
| カット | 参照画像 | モーションプロンプト（全節連結済み） | 尺 | リテイク条件 |
|--------|----------|----------------------------------|-----|--------------|
| cut-01 | neko+inu | （共通+配置+動作+カメラを連結した完成形） | 5s | 柄反転/位置入替はNG |
```

- **リテイク条件**を必ず書く（左右反転・柄消失・目の崩れ・余計な文字の出現）。
- 採用クリップは `cut-01.mp4` の連番で同フォルダに保存（.gitignore対象）。

## 音声・合成（生成後）

1. **動画は無音で生成**（ネイティブ音声は使わない — 日本語セリフの口調管理が不安定）
2. VOICEVOX でセリフを書き出し（ネコネコ=落ち着き系話者 / イヌイヌ=元気系話者・クレジット表記必須）
3. ffmpeg でクリップ連結 → テロップ・字幕・音声・BGMを合成（render.mjs のロジック流用）
4. **カット尺は音声長に合わせて調整**（クリップはループ可能な待機動作で生成しておくと伸ばせる）

## チェックリスト（生成前後）

- [ ] 参照画像は `assets/char-ref/` の確定版か（野良生成画像を使っていないか）
- [ ] ネコ左・イヌ右、柄の指定を全カットに明記したか
- [ ] 1カット=1アクションになっているか
- [ ] 上部テロップ余白が確保されているか／文字が焼き込まれていないか
- [ ] 合成後に `vet-marketing-compliance` チェック＋queue.json 承認ゲートを通したか
