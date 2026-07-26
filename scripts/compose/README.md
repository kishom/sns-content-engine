# compose — カットを繋いでテロップ付きリールに仕上げる

`scripts/char3d/animate.mjs` が書き出したカット動画（`cut-01.mp4`〜`cut-07.mp4`）に
**テロップ・字幕を焼き込み、1本の 9:16 リールに連結する**工程。

```
02-script.md（正本）
  └─ script.config.mjs  ← テロップ／字幕／尺／読み仮名／声 の定義（ここだけ触れば直せる）
       ├─ tts.mjs + tts.py   ← 音声合成（pyopenjtalk）→ voice.wav ＋ voice.timing.json
       └─ compose.mjs        ← 透過PNG生成（Chromium）→ ffmpeg合成 → 連結 → 音声多重化
            ├─ content/2026-07-22_cat-ckd/cat-ckd_reel.mp4         （無音マスター）
            └─ content/2026-07-22_cat-ckd/cat-ckd_reel_voiced.mp4  （音声入り＝投稿用）
```

## 使い方

```sh
cd /path/to/sns-content-engine

# ── 音声入りを作る（通常はこの2本） ──
node scripts/compose/tts.mjs                     # 音声合成＋タイムライン再計算（約10秒）
node scripts/compose/compose.mjs --voice         # 焼き込み＋音声多重化 → _voiced.mp4（約3分）
node scripts/compose/verify_voice.mjs            # 検証（尺・LUFS・字幕同期・話者の作り分け）

# ── その他 ──
node scripts/compose/tts.mjs --dry               # 合成せず「読み（カナ）」だけ確認＝誤読チェック
node scripts/compose/compose.mjs                 # 無音マスターを作り直す（従来どおり）
node scripts/compose/compose.mjs --overlays-only  # テロップPNGだけ書き出して見た目を確認
KEEP_WORK=1 node scripts/compose/tts.mjs          # 中間ファイル(.voice/)を残す
```

初回のみ `cd scripts/compose && npm install`（ffmpeg / ffprobe / Noto Sans JP を取得）。
音声には `pip install pyopenjtalk` が必要（初回実行時に辞書を自動DL）。

**必ず `tts.mjs` → `compose.mjs --voice` の順で実行すること。** tts.mjs が書く
`voice.timing.json`（カット尺・字幕時刻）を compose.mjs が読むため、台本を変えたら音声から作り直す。

## 音声（日本語TTS）

`cat-ckd_reel_voiced.mp4` に**日本語音声が入っている**。`cat-ckd_reel.mp4` は無音マスターとして残してある。

| | 無音版 | 音声版 |
|---|---|---|
| ファイル | `cat-ckd_reel.mp4` | `cat-ckd_reel_voiced.mp4` |
| 尺 | 40.00s（台本の時間割） | 54.10s（音声の実測に合わせて延長） |
| 音声 | 無音AAC | AAC 48kHz ステレオ / **-14 LUFS** |

### 声の作り分け

pyopenjtalk の声は**1種類しかない**ので、`script.config.mjs` の `SPEAKERS[].voice` で
ピッチ・話速・フォルマントを変えて2キャラを作っている。

| | speed | halfTone | formant | maxPause | 実測F0 |
|---|---|---|---|---|---|
| ネコネコ（落ち着き） | 0.94 | -2.0 | 0.970 | 0.30s | 309 Hz |
| イヌイヌ（元気） | 1.12 | +2.5 | 1.045 | 0.20s | 396 Hz |

実測のピッチ差 **4.3 半音**（`verify_voice.mjs` の 5) で毎回チェックされる）。
`formant` は `asetrate` で標本化レートごと動かして `atempo` で尺を戻す＝声道の太さが変わる。
`maxPause` は Open JTalk が読点「、」に入れる 0.5〜0.65 秒の間を詰める上限（間延び対策）。

### 尺は音声に合わせて自動で伸びる

台本の時間割（`dur` / `start` / `end`）は**無音版の値**。音声版では `tts.mjs` が
実測の音声長からタイムラインを引き直し、`voice.timing.json` に書く。

- セリフ間 0.38 秒 / カット頭 0.18 秒 / カット尻 0.35 秒の「間」を自動で入れる
- 音声が入りきらないカットは**尺を伸ばす**（縮めはしない）。素材クリップはループ可能なので
  compose.mjs が `-stream_loop` でそのまま埋める
- cut-05 のチェックチップは「①水を飲む量／②おしっこの量・色／③体重」を**3セグメントに分けて合成**し、
  各セグメントの実測開始にチップを吸着させている（`parts:` と `anchorPart:`）。
  だから「水」と言った瞬間に「水」のチップが出る

∴ **`script.config.mjs` の start / end を音声に合わせて手で直す必要はない。**

### 読み仮名の直し方（重要）

pyopenjtalk は漢字仮名交じり文を**誤読する**。実際にこのリールで見つかった誤読:

| 表記 | 誤った読み | 対処 |
|---|---|---|
| 年1〜2回 | トシイチ〜ニカイ（「〜」が読まれない／年がトシ） | `read:` で「1年に1回から2回」→ イチネンニイッカイカラニカイ |

手順:

1. `node scripts/compose/tts.mjs --dry` を実行し、`content/<PROJECT>/voice.readings.txt` の
   **kana 行を全部目視する**（合成せず読みだけ出るので速い）
2. 誤読があれば `script.config.mjs` の該当 sub に `read:` を足す
   ```js
   { who: 'cat', text: '7歳を過ぎたら、年1〜2回の<br>健康診断（血液・尿検査）で',
     read: '7歳を過ぎたら、1年に1回から2回の健康診断、血液や尿の検査で', start: 0.15, end: 3.2 },
   ```
3. `--dry` で読みが直ったことを確認してから本番合成

**`read:` は漢字を残したまま直すこと。** 全部ひらがなにするとアクセント推定が崩れて
かえって不自然になる（Open JTalk は表記からアクセント句を決めている）。
直すのは「誤読する語」と「間が欲しい位置の読点」だけでよい。

`text`（画面表示）と `read`（読み上げ）が違ってよいのは、**書き言葉を話し言葉にする範囲まで**。
意味を変えてはいけない（表示「年1〜2回」＝音声「1年に1回から2回」は同義なのでOK）。

### 検証

```sh
node scripts/compose/verify_voice.mjs
```

1. 音声ストリームの有無・尺の一致 2) ラウドネス（-14±1 LUFS / TP≦-1.0dBTP）
3. **字幕と音声の同期** — `silencedetect` で拾った発話開始と `voice.timing.json` の字幕開始を突き合わせ（実測 最大ズレ 0.03s）
4. 各セリフ区間に実際に音があるか 5) 2キャラのF0差（≧2半音）

> ⚠️ **ピッチの検証に素朴な自己相関のピーク取りを使わないこと。** 倍音を掴んでオクターブを誤り、
> 「2キャラの差が 0.4 半音しかない」という誤った結論が出た。`tts.py` の `yin_f0()`（YIN法）を使う。

### BGM

**現状BGMは無し（声だけ）。** 足すときは `tts.mjs` の loudnorm 段の直前に mix を挟む
（`voice.wav` を作る箇所にコメントで位置を書いてある）。声を -14 LUFS に置いたまま
BGMを -30 LUFS 前後で重ね、**最後に全体をまとめて -14 LUFS に正規化し直す**こと。

### ライセンス・クレジット表記（**必須**）

音声は **Open JTalk / HTS Voice "Mei"**（pyopenjtalk 0.4.1 同梱）で合成している。

| 構成要素 | ライセンス | クレジット |
|---|---|---|
| pyopenjtalk | MIT | 不要（著作権表示の保持のみ） |
| Open JTalk / HTS Engine API | 修正BSD | 不要（著作権表示の保持のみ） |
| 辞書（NAIST / UniDic） | 修正BSD | 不要（著作権表示の保持のみ） |
| **HTS Voice "Mei"** | **CC BY 3.0** | **必要** |

**HTS Voice "Mei" は CC BY 3.0 ＝ 表示（Attribution）が義務。** 商用利用・改変は可能だが、
**この音声を使った投稿にはクレジットを入れること。** キャプション末尾に入れる文言:

```
音声合成: Open JTalk / HTS Voice "Mei" (C) 2009-2013 Nagoya Institute of Technology,
MMDAgent Project Team — CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
```

（コピペ用は `content/<PROJECT>/voice.credits.md` にも置いてある）

VOICEVOX は使っていない。`pip install voicevox_core` は **PyPI に存在せず**（GitHub Releases 配布の
wheel ＋ 別途 ONNX ランタイムと音声モデル `.vvm` が必要）、この環境では導入していない。
VOICEVOX に載せ替える場合は**キャラクターごとに規約が異なり、クレジット表記が必須**なので
各キャラの利用規約を確認すること。

## テロップ設計

キャラクターは画面の y≈1010–1670 に立ち、顔は y≈1080–1260。
そこを避けて **上＝メインテロップ / 下＝セリフ字幕** の二層で組んでいる。

| 要素 | 位置 | 仕様 |
|---|---|---|
| メインテロップ | 上部 y150〜 | 白角丸パネル＋オレンジ縁。Noto Sans JP 700 / 76px。台本の「テロップ」列 |
| 強調 | テロップ内 | `<em>` → **PAWSオレンジ `#E8651A`**（赤は使わない） |
| セリフ字幕 | 下部（足元より下） | 濃茶パネル＋白文字 500 / 47px。話者は絵文字ではなく**名前チップ**で示す |
| 名前チップ | 字幕の左上 | ネコネコ＝クリーム `#FFEFC9` / イヌイヌ＝タン `#DDB889` |
| cut-05 チェック | y486 の帯 | 3Dアイコン（水皿/トイレ/体重計）の **x中心 208 / 587 / 946 に列を合わせる**。0.6秒ずつ順に出す |
| cut-07 カード | 上部 | チェックリスト再掲＋「あとで見返せるように保存」 |
| 画面内免責 | **テロップ／カードの直下**（cut-03・04・07） | 「※一般的な情報です。診断はかかりつけの獣医師へ」**省略不可** |

### 免責の置き方（コンプラ要件・変更しないこと）

- **画面下端に置いてはいけない。** IG Reels / TikTok は下部 190〜290px がキャプション・いいね・
  プログレスバーに覆われる。景表法の打消し表示は「表示されているが見つけにくい」だと不十分と
  評価されうるため、下端に置くと実質「免責なし」に近くなる。
  → `compose.mjs` に **下端から300px以上** を満たさなければ**エラーで停止する**チェックを入れてある
  （実測: cut-03/04 は 1413px、cut-07 は 1086px）。
- **末尾カットだけに出さない。** 完視聴しない視聴者に一度も届かない。
  病名・症状を出すカット（とくに cut-04「シニア猫に多い慢性腎臓病」）に必ず併記する。
- 免責はメインテロップと同じ `.top` スタックに流し込んでいるので、**主張のすぐ下に自動配置される**
  （位置の手計算は不要。テロップの行数が変わっても崩れない）。

- チェック／ピンのアイコンは**絵文字ではなくインラインSVG**。ブランド色で描け、フォント依存もない。
- 各レイヤーは 0.22 秒の alpha フェードで出入りする。
- 尺は台本の時間割に合わせる（素材が短いカットは `-stream_loop` でループ延長、長ければトリム）。
  カット動画はループ可能に作られており、継ぎ目の PSNR は通常の隣接フレームと同等＝繋ぎ目は見えない。

## ハマりどころ（実測）

- **フォントスタックに `Noto Color Emoji` を入れてはいけない。** 同フォントは keycap 用に ASCII 数字を
  持っているため、Chromium が「3」「7」を**絵文字グリフ（灰色・字送りが広い）**で描き、
  「この 3 つ」のように不自然な隙間が空く。数字を含むテロップは必ず目視確認すること。
- **`white-space: nowrap` の長いテロップは画面外にはみ出す。** 対策として compose.mjs に
  自動縮小（はみ出したら 2px ずつ font-size を下げ、解消できなければエラーで停止）を入れてある。
  ただし**改行位置は自動任せにせず `<br>` で明示する**方が仕上がりが良い（日本語は文字単位で折り返すため、
  「（血 / 液・尿検査）」のように語の途中で切れる）。
- **素材と同尺のカットに `-t` だけ掛けると最終フレームが1枚落ちる**（6.00s → 5.97s）。
  等尺のときも `-stream_loop -1` を付けて `-t` で正確に切る。
- 日本語フォントはシステムに無いので npm `@fontsource/noto-sans-jp` の woff2 を `@font-face` で読む
  （Chromium は `--allow-file-access-from-files` 付きで起動）。

## 出力仕様

| ファイル | 内容 |
|---|---|
| `cat-ckd_reel.mp4` | 40.00s / 1080×1920 / 30fps（1200フレーム）/ H.264 High / yuv420p / +faststart / **無音**AAC 48kHz |
| `cat-ckd_reel_voiced.mp4` | 54.10s / 同上 / **AAC 180kbps 48kHz ステレオ / -14.35 LUFS / -4.1 dBTP** |
| `voice.wav` | 音声のみ（54.10s / 48kHz / -14 LUFS）。編集で差し替えるとき用 |
| `voice.readings.txt` | 全セリフの読み（カナ）＋実測長。**誤読チェックの一次資料** |
| `voice.credits.md` | キャプションに貼るクレジット文（CC BY 3.0 の表示義務） |
