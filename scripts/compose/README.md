# compose — カットを繋いでテロップ付きリールに仕上げる

`scripts/char3d/animate.mjs` が書き出したカット動画（`cut-01.mp4`〜`cut-07.mp4`）に
**テロップ・字幕を焼き込み、1本の 9:16 リールに連結する**工程。

```
02-script.md（正本）
  └─ script.config.mjs  ← テロップ／字幕／尺／読み仮名／声 の定義（ここだけ触れば直せる）
       ├─ tts.mjs + tts.py   ← 音声合成（VOICEVOX CORE）→ voice.wav ＋ voice.timing.json
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
音声には **VOICEVOX CORE** が必要（下記「VOICEVOX の入れ方」）。無い場合は
`pip install pyopenjtalk` の旧エンジンに自動フォールバックする（音質は大きく劣る）。

**必ず `tts.mjs` → `compose.mjs --voice` の順で実行すること。** tts.mjs が書く
`voice.timing.json`（カット尺・字幕時刻）を compose.mjs が読むため、台本を変えたら音声から作り直す。

## 音声（日本語TTS）

`cat-ckd_reel_voiced.mp4` に**日本語音声が入っている**。`cat-ckd_reel.mp4` は無音マスターとして残してある。

| | 無音版 | 音声版 |
|---|---|---|
| ファイル | `cat-ckd_reel.mp4` | `cat-ckd_reel_voiced.mp4` |
| 尺 | 40.00s（台本の時間割） | 44.50s（音声の実測に合わせて延長） |
| 音声 | 無音AAC | AAC 48kHz ステレオ / **-14 LUFS** |
| エンジン | — | **VOICEVOX CORE 0.15.7**（ニューラル合成） |

### VOICEVOX の入れ方

**PyPI には無い**。GitHub Releases の wheel と ONNX Runtime、Open JTalk 辞書を個別に取る。
公式のダウンローダー（`download-linux-x64`）は **GitHub API を叩くので API が塞がれた環境では動かない**。
その場合は下記のようにアセットURLを直接指定すれば通る（リリースアセットの配信は API とは別系統）。

```sh
cd /tmp && B=https://github.com/VOICEVOX/voicevox_core/releases/download/0.15.7
curl -sSL -o "voicevox_core-0.15.7+cpu-cp38-abi3-linux_x86_64.whl" \
  "$B/voicevox_core-0.15.7+cpu-cp38-abi3-linux_x86_64.whl"   # 1.25GB（音声モデル同梱）
curl -sSL -o vvcore.zip "$B/voicevox_core-linux-x64-cpu-0.15.7.zip"   # libonnxruntime 同梱
curl -sSL -o ojt.tar.gz \
  "https://github.com/r9y9/open_jtalk/releases/download/v1.11.1/open_jtalk_dic_utf_8-1.11.tar.gz"
unzip -q vvcore.zip && tar xzf ojt.tar.gz

# リポジトリ直下に配置（.gitignore 済み）
cd <repo>
python3 -m venv --system-site-packages .venv-voicevox
.venv-voicevox/bin/pip install /tmp/voicevox_core-0.15.7+cpu-cp38-abi3-linux_x86_64.whl
mkdir -p .voicevox/lib
cp /tmp/voicevox_core-linux-x64-cpu-0.15.7/libonnxruntime.so.1.13.1 .voicevox/lib/
cp -r /tmp/open_jtalk_dic_utf_8-1.11 .voicevox/

# 確認
.venv-voicevox/bin/python scripts/compose/tts.py --check      # → voicevox
.venv-voicevox/bin/python scripts/compose/tts.py --speakers   # → 話者と styleId の一覧
```

> ⚠️ **wheel のファイル名を変えると `pip install` が「not a valid wheel filename」で落ちる。**
> `+cpu-cp38-abi3-linux_x86_64` の部分まで含めて保存すること。
> ⚠️ **`import voicevox_core` の前に libonnxruntime を開く必要がある。** `tts.py` が
> `ctypes.CDLL(..., RTLD_GLOBAL)` で先読みしている。素の import は必ず ImportError になるので、
> 「入っているのに入っていない」と誤判定しないこと（`voicevox_available()` は find_spec で見ている）。

### 声の作り分け

VOICEVOX は**キャラごとに別の話者**を割り当てられる。旧 pyopenjtalk 版のように
「1つの声のピッチ違い」で作り分ける必要はない（`formant` / `halfTone` の小細工は廃止）。

| | 声 | styleId | speedScale | pauseScale | 実測F0 | 実測モーラ/秒 |
|---|---|---|---|---|---|---|
| ネコネコ（落ち着き） | 波音リツ／ノーマル | 9 | 1.07 | 0.42 | **252.6 Hz** | 8.4 |
| イヌイヌ（元気） | 春日部つむぎ／ノーマル | 8 | 1.40 | 0.40 | **346.0 Hz** | 9.2 |

実測のピッチ差 **5.44 半音**（`verify_voice.mjs` の 5) で毎回チェックされる）。

**話者を選ぶときの3つの落とし穴**（実際に踏んだ）:

1. **話者ごとに素の話速が全く違う。** 同じ `speedScale=1.63` でも 九州そら は 9.1 モーラ/秒、
   波音リツ は 13.6 モーラ/秒だった（同一文で実測）。∴ `speedScale` は「キャラの速さ」ではなく
   **目標モーラ/秒から逆算する係数**。素が速い話者ほど引き伸ばし量が減り音質が良い。
2. **キャラの速さの差は `speedScale` の大小では表せない。** 効くのは出来上がりのモーラ/秒。
   `tts.mjs` が毎回ログに出すのでそれで見る。
3. **ピッチは必ず実測する。** 最初 九州そら×白上虎太郎 にしたら F0 が 258Hz と 255Hz で
   **0.2 半音差＝聞き分け不能**だった。`docs/character.md` の「ネコ＝低め／イヌ＝明るい」を
   満たすには **ネコ < イヌ** にすること。

### テンポ設計（ショート動画の生命線）

「機械っぽい・遅すぎる」は**話速だけの問題ではない**。内訳を分けて潰す。

| レバー | どこ | 効き方 |
|---|---|---|
| 話速 | `SPEAKERS[].speedScale` | 発話そのものの長さ。**合成前の AudioQuery を直す**ので早口にしても音が痩せない |
| 読点の間 | `SPEAKERS[].pauseScale` | 「、」の無音を何倍にするか。0.4 前後まで詰めてよい |
| セリフ間 | `tts.mjs` の `GAP`（既定 0.20s） | 掛け合いの応酬感。15セリフ＝8ギャップあるので 0.1s の差が 0.8s に効く |
| カット頭/尻 | `LEAD` 0.10s / `TAIL` 0.18s | 7カット分あるので合計で 2s 級に効く |
| **無音の余り** | `CUTS[].voiceDur` | **セリフが終わったのに絵だけ流れる時間。ここが「間延び」の正体** |

- 判断は耳の主観でなく **モーラ/秒**（日本語の標準的な話速指標）で行う。`tts.mjs` が毎回出力する。
  **6〜8=自然な会話 / 7.5〜8.5=ショート向き / 9以上=早口で聞き取りにくい。**
  医療情報を喋る側（ネコネコ）は理解が目的なので **8.5 を超えさせない**。
- `V_SPEED` / `V_GAP` / `V_TAIL` などの環境変数で上書きして sweep できる。
  例: `V_SPEED=1.25 node scripts/compose/tts.mjs`
- **話速を上げてもカットの下限（`dur`）より短くはならない。** 下限に当たったカットでは
  余った時間がそのまま**無音**になり、かえって間延びする。`tts.mjs` のログが
  `⚠ 無音の余り` で教えてくれるので、そのカットは `voiceDur` で下限を下げる。
- `voiceDur` は**音声版だけの下限**。`dur` を直接いじると無音版 `cat-ckd_reel.mp4` の
  時間割まで変わってしまうので**触らないこと**。
- `CUTS[].tempo = { lead, gap, speed }` でカット単位の上書きもできる。
  cut-01 はフックの反転を **2.5 秒以内に言い終わる**要件（`02-script.md`）があるので
  ここだけ間を詰めて速めている。`tts.mjs` が毎回検算してログに出す。

### 尺は音声に合わせて自動で伸びる

台本の時間割（`dur` / `start` / `end`）は**無音版の値**。音声版では `tts.mjs` が
実測の音声長からタイムラインを引き直し、`voice.timing.json` に書く。

- セリフ間 0.20 秒 / カット頭 0.10 秒 / カット尻 0.18 秒の「間」を自動で入れる
- 音声が入りきらないカットは**尺を伸ばす**（縮めはしない）。素材クリップはループ可能なので
  compose.mjs が `-stream_loop` でそのまま埋める
- cut-05 のチェックチップは「①水を飲む量／②おしっこの量・色／③体重」を**3セグメントに分けて合成**し、
  各セグメントの実測開始にチップを吸着させている（`parts:` と `anchorPart:`）。
  だから「水」と言った瞬間に「水」のチップが出る

∴ **`script.config.mjs` の start / end を音声に合わせて手で直す必要はない。**

### 読み仮名の直し方（重要）

日本語TTSは漢字仮名交じり文を**誤読する**（VOICEVOX も読みの解析は Open JTalk なので同じ）。
実際にこのリールで見つかった誤読:

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

VOICEVOX 版では kana は **AudioQuery の accent_phrases から復元した実際の読み**なので、
「合成に使われた読みそのもの」が出る（推定ではない）。VOICEVOX は 慢性腎臓病＝マンセエジンゾオビョオ、
多飲多尿＝タインタニョオ、体重＝タイジュウ を正しく読めることを実測で確認済み。

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

> ⚠️ **`silencedetect` の `d`（無音とみなす最短長）は、台本上いちばん短い「間」より短くすること。**
> フックは食い気味に返すため cut-01 の `gap` が 0.07s しかなく、`d=0.12` だと2発話が1区間に
> 融合して「1.17s ズレている」と**誤検知**した（音声は正常）。現在は `d=0.06`。

> ⚠️ **ピッチの検証に素朴な自己相関のピーク取りを使わないこと。** 倍音を掴んでオクターブを誤り、
> 「2キャラの差が 0.4 半音しかない」という誤った結論が出た。`tts.py` の `yin_f0()`（YIN法）を使う。

### BGM

**現状BGMは無し（声だけ）。** 足すときは `tts.mjs` の loudnorm 段の直前に mix を挟む
（`voice.wav` を作る箇所にコメントで位置を書いてある）。声を -14 LUFS に置いたまま
BGMを -30 LUFS 前後で重ね、**最後に全体をまとめて -14 LUFS に正規化し直す**こと。

### ライセンス・クレジット表記（**必須**）

音声は **VOICEVOX** で合成している。VOICEVOX は**商用・非商用問わず無料**だが、
**クレジット表記が義務**（申請・契約・費用は不要）。

| 構成要素 | ライセンス | クレジット |
|---|---|---|
| VOICEVOX CORE 0.15.7 | コアライブラリ利用規約（商用可）※0.16以降は MIT | VOICEVOX 名義で必要 |
| ONNX Runtime 1.13.1 | MIT | 不要 |
| Open JTalk 辞書 | 修正BSD | 不要 |
| 音声モデル (.bin/.vvm) | VOICEVOX 音声モデル利用規約（商用可・組み込み再配布可） | VOICEVOX 名義で必要 |
| **各キャラの音声ライブラリ** | **キャラごとの規約** | **必要** |

キャプションに貼る文（`VOICEVOX:<名前>` が規定の形式。**使った声を全部列挙する**）:

```
音声合成: VOICEVOX:波音リツ / VOICEVOX:春日部つむぎ
```

> ⚠️ **声を変えたら `content/<PROJECT>/voice.credits.md` とキャプションを必ず同時に直す。**
> 判断根拠・使ってはいけない声・公開前の確認事項はすべて `voice.credits.md` にまとめてある。

**使ってはいけない声**（パイプラインの許可リストから除外）:

- **ナースロボ＿タイプＴ** — 「故意に医療知識の誤った流布をする及び誤解を生む行為」「他のキャラクター
  として扱うこと」が禁止＝**医療テーマ＋オリジナルキャラへの声当ての本用途では二重に抵触**
- **企業利用に権利者への事前確認が要る声**: 青山龍星 / 後鬼 / もち子さん / No.7 / Voidoll / ぞん子 /
  ユーレイちゃん / 猫使アル・猫使ビィ

その他の運用ルール: モーフィングは使わない（両規約が重畳し厳しい方が適用）。生成音声を
AI学習・ボイスチェンジャーに流用しない。政治・宗教・誹謗中傷・R18 での利用不可。

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
- **VOICEVOX の wheel はファイル名を変えると `pip install` が落ちる**
  （`not a valid wheel filename`）。`+cpu-cp38-abi3-linux_x86_64` まで含めて保存する。
- **`import voicevox_core` は libonnxruntime を先に `ctypes.CDLL(..., RTLD_GLOBAL)` で
  開いてからでないと必ず失敗する。** 素の import で存在判定をすると「入っているのに入っていない」と
  誤判定するので、`tts.py` の `voicevox_available()` は `importlib.util.find_spec` で見ている。
- **GitHub API が塞がれていても Releases のアセット配信は通ることがある。**
  VOICEVOX 公式ダウンローダーは API を使うので落ちるが、アセットURL直指定なら取得できた
  （`api.github.com` は 403 / `github.com/.../releases/download/...` は 200）。
- **話速を上げてもカット下限（`dur`）より短くはならず、余りが無音になって逆に間延びする。**
  `tts.mjs` の `⚠ 無音の余り` を見て `voiceDur` で下限を下げること。

## 出力仕様

| ファイル | 内容 |
|---|---|
| `cat-ckd_reel.mp4` | 40.00s / 1080×1920 / 30fps（1200フレーム）/ H.264 High / yuv420p / +faststart / **無音**AAC 48kHz |
| `cat-ckd_reel_voiced.mp4` | **44.50s** / 同上 / **AAC 182kbps 48kHz ステレオ / -14.23 LUFS / -4.48 dBTP** |
| `voice.wav` | 音声のみ（44.50s / 48kHz / -14 LUFS）。編集で差し替えるとき用 |
| `voice.readings.txt` | 全セリフの読み（カナ）＋実測長＋モーラ/秒。**誤読チェックの一次資料** |
| `voice_sample.mp3` | 冒頭16秒の音声サンプル（聴き比べ用） |
| `voice_sample_old_openjtalk.mp3` | 旧 pyopenjtalk 版の同じ区間（比較用） |
| `voice.credits.md` | キャプションに貼るクレジット文＋ライセンス判断の根拠 |
