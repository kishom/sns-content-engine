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
