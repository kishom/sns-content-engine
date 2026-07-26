# char3d — ネコネコ & イヌイヌ ソフト3Dレンダラー（Three.js + ヘッドレスChromium）

`prompts/05-visual.md` / `docs/character.md` を正本とする、マスコット2体の
「ふわもち3Dトイ」スタイルのプログラマティック・レンダラー。
AI画像生成に依存せず、**柄・左右・色（HEX）を座標で厳密固定**した基準画像を生成する。

## 再実行方法

```sh
cd scripts/char3d
npm install            # 初回のみ（three をローカル node_modules に入れる）
node render.mjs        # 納品4ショットを assets/char-ref/ に出力
```

個別ショット / デバッグターンテーブル（柄の左右検証用）:

```sh
node render.mjs hero_duo duo_vertical        # 指定ショットのみ
node render.mjs neko_yaw_120 inu_yaw_200     # 任意の角度で回して柄を確認（scripts/char3d/debug/ に出力）
```

**表情バリエーション**（`prompts/05-visual.md` の表情定義に対応 / 1080x1350 等倍）:

```sh
node render.mjs expressions                  # 8枚まとめて → assets/char-ref/expressions/
node render.mjs expr_neko_doya expr_inu_hatto  # 個別（ファイル名は neko_doya.png / inu_hatto.png）
```

| shot | 出力 | 表情（05-visual.md） |
|---|---|---|
| `expr_neko_nonbiri` | `neko_nonbiri.png` | のんびり（横長レンズの半目＋ゆるい微笑） |
| `expr_neko_doya` | `neko_doya.png` | どや顔（片側上がりの笑み＋相方側へ手を上げる） |
| `expr_neko_shinpai` | `neko_shinpai.png` | 心配（下がり目＋もにょっとした口＋体を傾ける） |
| `expr_neko_yareyare` | `neko_yareyare.png` | やれやれ（棒目＋一文字口） |
| `expr_inu_egao` | `inu_egao.png` | 満面の笑み（大きく開いた口＋舌＋キラ目） |
| `expr_inu_zenryoku` | `inu_zenryoku.png` | 全力（跳ねて縦ストレッチ＋耳が跳ねる） |
| `expr_inu_shombori` | `inu_shombori.png` | しょんぼり（耳が垂れる＋涙目＋への字口） |
| `expr_inu_hatto` | `inu_hatto.png` | ハッと気づき（見開いた点目＋小さく開いた口＋眉上げ） |

**コンテンツのカット構図**（cat-ckd の7カット / 9:16 1080x1920 等倍・**文字は焼き込まない**）:

```sh
node render.mjs cuts                         # cut-01〜07 → content/2026-07-22_cat-ckd/
node render.mjs cut-05                       # 個別
```

カットの定義は `scene.js` の `CUTS` にある（正本 = `content/2026-07-22_cat-ckd/05-animate.md` のカット表）。
構図を直すときは `CUTS['cut-0N']` の中身（表情・ポーズ・小道具・`duoCam()`/`soloCam()`）だけを触る。

- 表情の追加 = `makeBodyTexture()` の `expr` switch に1本足す（顔の描画のみ。造形・柄・色は触らない）
- ポーズ = `buildChar(kind, { expr, pawRaise:'left'|'right', pawTap, earDroop, earUp, bounce, tilt, nod })`
  （すべて group 変換とパーツ位置のみ。メッシュ形状は不変）
- 小道具 = `makeWaterBowl()` / `makeLitterBox()` / `makeWeighScale()` / `makeCross()` / `makeIconPlate()` / `makeSparkle()`
- 納品4ショットを壊さず試したいとき: `OUT_OVERRIDE=/tmp/x node render.mjs deliverables`

**動画（mp4）を書き出す**（cat-ckd 7カット / 9:16 1080x1920 / 30fps / H.264）:

```sh
node animate.mjs                 # 全7カット → content/2026-07-22_cat-ckd/cut-0N.mp4
node animate.mjs cut-01          # 個別
node animate.mjs cut-01 cut-07   # 複数
```

環境変数: `FPS=30` / `CONCURRENCY=2`（同時レンダリング数・4コア想定） /
`OUT_DIR=<dir>`（出力先） / `KEEP_FRAMES=1`（中間PNG `.render/` を残す）

外部の動画生成AI（Kling / Veo）は使わず、**Three.js のシーンを自前でアニメーションさせて
フレーム連番を撮り、ffmpeg で mp4 にする**。ffmpeg のバイナリは npm の
`@ffmpeg-installer/ffmpeg`（＋検証用に `@ffprobe-installer/ffprobe`）から取得する
＝システムに ffmpeg が無くても動く。

前提（Claude Code クラウド環境）:
- Playwright: `/opt/node22/lib/node_modules/playwright/index.mjs` を import（render.mjs 内で指定済み）
- Chromium: `/opt/pw-browsers/chromium`（render.mjs 内で executablePath 指定済み）
- 別環境では render.mjs 冒頭の `PLAYWRIGHT` / `CHROMIUM` 定数を書き換える

## 出力（納品ショット）

| ファイル | サイズ | 内容 |
|---|---|---|
| `assets/char-ref/hero_duo.png` | 2160x2700 (4:5) | 2体並び・**ネコ左/イヌ右**・正面やや斜め |
| `assets/char-ref/nekoneko_front.png` | 2160x2700 | ネコネコ単体 3/4ビュー（左灰ぶちを見せる側） |
| `assets/char-ref/inuinu_front.png` | 2160x2700 | イヌイヌ単体 3/4ビュー |
| `assets/char-ref/duo_vertical.png` | 2160x3840 (9:16) | 縦構図・上部约45%テロップ余白 |

（この4枚は **Kisho GO 済みの正本**。再生成しても見た目は変わらない＝実測 mean 0.008/255 だが、原則上書きしない）

| 追加出力 | サイズ | 内容 |
|---|---|---|
| `assets/char-ref/expressions/{neko,inu}_*.png` | 1080x1350 | 表情8種（I2V の参照画像用） |
| `content/2026-07-22_cat-ckd/cut-01〜07.png` | 1080x1920 | cat-ckd 7カットの構図（テロップは後段の合成レイヤー） |
| `content/2026-07-22_cat-ckd/cut-01〜07.mp4` | 1080x1920 30fps | 実際に動く7クリップ（H.264 High / yuv420p / faststart・**無音**） |

※ mp4 と中間PNG（`.render/`）は `.gitignore` 済み＝**再生成可能な生成物**なのでコミットしない。
静止画 `cut-*.png` は I2V 入力用の正本としてコミットする（別物）。

## アニメーション（animate.mjs / anim.js）

### 尺と動き（正本 = `content/2026-07-22_cat-ckd/05-animate.md`）

| カット | 尺 | 動き |
|---|---|---|
| cut-01 | 4s | イヌ=4回バウンス（着地squash）＋しっぽ高速＋耳ゆれ／ネコ=呆れた無反応（呼吸＋わずかな重心移動）／キラキラ明滅 |
| cut-02 | 5s | ネコ単体=ゆっくり左右に揺れる＋**スローまばたき2回**＋耳ゆれ |
| cut-03 | 6s | イヌ=ハッと驚く（縮む→伸びる）＋耳ぱたぱた／ネコ=前傾＋手で2回「トン」 |
| cut-04 | 6s | ネコ単体=手を上げてゆらす（解説）＋首かしげ |
| cut-05 | 7s | ネコ=手で3回数える（水・おしっこ・体重）／イヌ=ハッ＋小バウンス／3アイコンが位相差でふわふわ |
| cut-06 | 6s | ネコ=ゆったり揺れ＋スローまばたき／イヌ=**こくりと2回うなずく**／緑の十字がふわふわ |
| cut-07 | 6s | 2人が同位相でふわっと跳ねる（イヌのほうが高く）＋キラキラ明滅 |

### 動きの語彙（`anim.js` の関数＝カット定義から組み合わせて使う）

`idle`（ぷにぷに待機・呼吸） / `bounce`（バウンス＋着地squash） / `surprise`（びっくり＝縮む→伸びる） /
`nod`（うなずき） / `sway`（首かしげ・左右の揺れ） / `pawWave`（手を上げてゆらす） /
`pawTap`（手でトン＝強調・数える） / `earFlap`（耳が跳ねる） / `earIdle`（耳の微揺れ） /
`tailWag`（しっぽ振り） / `blink`（まばたき） / `twinkle`（キラキラ） / `floatProp`（小道具のふわふわ）

### 設計の要点（触る前に読む）

- **造形には一切触らない。** `anim.js` は `scene.js` の確定ビルダを import して、
  **group 変換とパーツ変換だけ**を時刻の関数として動かす。
- **決定論的**: rAF は使わない。`window.__renderFrame(t)` が
  「基準ポーズへ `reset()` → t からポーズを算出 → 同期描画」を行う。同じ t は常に同じ絵。
  ∴ 途中から再レンダリングしても差分が出ない。
- **ループ可能**: すべての動きは正規化位相 `u = (t/duration) mod 1` の関数で、
  ①sin/cos の**整数倍周期** ②**両端でゼロになる窓関数**（`win()` / `bounceH()`）
  のどちらかしか使わない。→ u=0 と u=1 のポーズが厳密に一致する。
  最終フレームは `i = frames-1` まで（`i = frames` は u=0 と同じ絵なので撮らない＝重複コマを作らない）。
  **音声長に合わせて ffmpeg 側でループ延長できる**（`-stream_loop` / `loop` フィルタ）。
- **カメラは固定**（`duoCam()` / `soloCam()` をセットアップ時に1回だけ呼ぶ）。ズーム等は ffmpeg で後掛け。
- **顔は球に貼った平面テクスチャ** ＝ ヨー/ロールを振ると破綻する。
  `sway()` は `clamp(±0.15rad)` でロールを固定的に制限している。**この上限を上げてはいけない。**
- **ネコ左・イヌ右厳守**（`placeDuo()` 以外で配置しない）。柄・色は不変。
- まばたきは**閉じ目テクスチャを貼った同形状メッシュの表示切替**（`addBlink()`）。
  ネコの `niko`（∩の閉じ目）は `nonbiri` と口がほぼ同形なので、そのまま瞬きに流用できる。
  まばたきの窓は必ず `0 < a < b < 1`（ループ端では必ず目を開けている）。

## 構成

- `scene.html` — importmap（three → ./node_modules）+ scene.js を読むだけの器
- `anim.html` — 同じ器の animate 版（anim.js を読む）
- `anim.js` — 動きの語彙 + カット別アニメーション定義（造形には触らない）
- `animate.mjs` — Playwright でフレーム連番を撮り ffmpeg で mp4 にする
- `scene.js` — 全ロジック。造形/テクスチャ/ライティング/ショット定義
- `render.mjs` — Playwright でヘッドレス撮影（viewport 1080x1350 等 × deviceScaleFactor 2）

## 実装の要点（触るときに読む）

- **座標系**: キャラは +z（カメラ）向き。**キャラ自身の左 = +x = テクスチャ u=0.5**、
  右 = -x = u=0.0、正面 = u=0.25。柄の左右はすべてこの規約で配置している。
  05-visual.md の「LEFT ear」等は**キャラ自身の左**。
- **柄=個体識別子（絶対に変えない）**:
  - ネコ: 左耳メッシュ=灰 #BFB4A4 ＋ 頭部左上の灰ぶち（テクスチャ楕円3枚）＋
    右下ボディ斑1つ（u≈0.16）＋ 右カールしっぽ（TubeGeometry, -x側）
  - イヌ: こげ茶 #8F6B44 垂れ耳 両側 ＋ まゆ点2 ＋ 左下背中の柄 #C6A880（u≈0.57）＋ 左しっぽ（+x側）
- **顔・柄はすべて CanvasTexture（4096x2048 equirect）を球に貼る**。緯度による横伸びは
  `1/sin(θ)` 補正で円が円に見えるよう描画（`ell()` ヘルパー）。
- **豆型**は SphereGeometry の頂点変形（下ぶくれ bulge / 上すぼみ taper をベイク）。
- **マット質感**: MeshPhysicalMaterial roughness 0.97 + sheen 0.55（微起毛のベルベット感）。
  glossy が出たら roughness/sheen とライト強度を疑う。
- ライティング: key + fill + rim + Hemisphere + RoomEnvironment(0.26)、VSM ソフトシャドウ、
  ACESFilmicToneMapping。**明るくしすぎるとタン色が白飛びして犬猫の色差が消える**（実測）。
- ヘッドレスでは rAF が発火しないことがある → 同期レンダリング＋ `window.__done` フラグ方式。
- file:// の ES modules は `--allow-file-access-from-files` が必須（render.mjs で指定済み）。

## ハマりどころ（実測の教訓）

1. **イヌ垂れ耳の回転符号**: `rotation.z = +sx*0.78` が正（上端が頭頂側・下端が外へ垂れる）。
   符号を逆にすると「翼/クマ耳」になる。
2. ネコ耳はロングにするとウサギに見える。Lathe の高さ 0.55・pow 0.55（丸い先端）が現行値。
3. 灰ぶちを前面（u=0.25 付近）まで伸ばすと「前髪」に見える。u 0.33〜0.52 の上部に集約する。
4. キャラ2体の 9:16 は視野幅が狭い。カメラ z=13+ まで引かないと耳・しっぽが見切れる。
   **カット構図は `duoCam()`（z=14.0・camera.x=0.05）＋ `placeDuo(..., {offsetX:0.12})` が実測の下限**。
   ネコのしっぽは自身の右（画面左）に 1.18 伸びるので、ペアをわずかに右へ寄せないと左端で切れる。
5. **表情は「顔の描き方」で決まる。線を足すほど怒って見える**（実測）:
   - 半目に「まぶたの線」を足す / 上辺を直線で切る → **怒り眉・ガン見**になる。
     のんびりは上下とも丸い横長レンズ形にする。
   - 心配は ∪ の閉じ目だと「安らか」に見えてしまう。**点目＋外側が下がったまぶた（下がり目）**が正解。
   - イヌの「ハッ」の口を鼻に近づけると鼻づらと融合して**マズルのように見える** → 口を下げる（y=806）。
6. **キラキラを立体（八面体等）で作ると、ライティングで灰色に沈んで「紙片/ゴミ」に見える。**
   カメラ向きの板 + 透過テクスチャ + `MeshBasicMaterial`（ライト非依存）にすると暖色のキラとして読める。
7. **小道具の中身はカメラより高い位置に置くと読めない**（器/トイレ/体重計を下から見ることになる）。
   アイコン化するときは中身だけ `rotation.x` で手前に倒す。板の色はキャラと同系だと同化するので
   パステルで色差をつける（真っ白なカードに見えた実例あり）。水は薄すぎると器と同化＝「空の皿」。
8. **十字アイコンは必ず緑/パステル。赤十字は色味違いでも不可**（赤十字標章の使用制限）。`COL.crossGreen` を使う。
9. `page.waitForFunction(fn, options)` は**間違い**（第2引数は arg）。options は第3引数。
   これを間違えると常に既定30秒になり、`duo_vertical`（2160x3840・ソフトウェアGL）が必ずタイムアウトする。
10. 微起毛スペックルは seed 固定（mulberry32）。以前は `Math.random()` で毎回変わっていた＝
   再レンダリングの差分検証ができなかった。GO済み4ショットとの実測差は mean 0.008/255（知覚不可）。

### アニメーション化で分かったこと（2026-07-26）

11. **回転の支点を動かすには pivot Group でくるむ。** しっぽ/垂れ耳は「メッシュ中心」で回すと
   付け根ごと動いて破綻する。`buildChar()` の `pivotAt(mesh, localTip)` は
   pivot を付け根へ置き、子の相対位置で相殺する＝**静止状態のワールド変換が完全に元と同一**。
   実際、この改修後に `node render.mjs cuts` を回して**7枚とも MD5 が1バイトも変わらなかった**。
   造形に触らずに可動域だけ足したいときはこの型を使う。
12. **キラキラの明滅は「静止画を上限」にして絞る方向にしか振らない。** scale を 1.15 まで上げたら
   確定静止画より大きい白い塊になり「紙片」に見えた（教訓6の再発）。現行は scale 0.86〜1.06 /
   opacity 0.55〜1.0。
13. **ループ継ぎ目は目視でなく PSNR で判定できる。**「最終フレーム→先頭フレーム」の PSNR が
   「通常の1フレーム進み」の PSNR とほぼ同じなら、継ぎ目は通常の動きと区別がつかない＝飛んでいない。
   実測 cut-01: seam 38.5dB / 通常ステップ 38.6dB（離れたフレーム同士だと 34.6dB）。
14. **フレーム撮影のコストは 1枚 約2.2秒**（1080x1920・SwiftShader ソフトウェアGL・VSMシャドウ）。
   7カット1200フレームで実測 約30分（`CONCURRENCY=2`・4コア）。セットアップ（テクスチャ生成/
   シェーダコンパイル）は1カットあたり15〜30秒かかるので、**ページはカットごとに1回だけ開く**。
15. **イヌのしっぽは正面カメラからはほぼ見えない**（体の後ろ側 z=-0.80 に埋まっている）。
   `tailWag()` は実装してあるが、現行のカット構図では効果がほぼ画に出ない。
   見せたい場合は**キャラを回す（yaw）のではなく**（顔テクスチャが破綻する）、
   カメラ側を振るカットを別に設計すること。
