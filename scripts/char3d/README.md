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

## 構成

- `scene.html` — importmap（three → ./node_modules）+ scene.js を読むだけの器
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
