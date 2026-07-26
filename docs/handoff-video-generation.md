# 動画生成の依頼書（Cowork / ブラウザ操作できるセッション向け）

cat-ckd（猫の慢性腎臓病・啓蒙リール）の7カットをI2V生成するための作業指示。
**このリポジトリの `content/2026-07-22_cat-ckd/cut-01.png` 〜 `cut-07.png` が入力画像**（3Dレンダリング済み・生成不要）。

---

## 依頼内容

Kling AI（https://kling.ai）の **画像→動画（Image to Video）** で、7枚のPNGをそれぞれ動画クリップに変換する。

### 手順（1カットあたり）

1. Image to Video を選択
2. `cut-0N.png` をアップロード
3. 下表の N 番のプロンプトを入力
4. ネガティブプロンプト（全カット共通）: `arms, hands, fingers, humanlike limbs, text, watermark, camera movement, realistic fur`
5. 設定: **9:16縦 / 5秒 / カメラ固定（static）**
6. 出力を `cut-0N.mp4` として保存

### プロンプト（カット別）

全カット共通で先頭に付ける:
```
Soft 3D toy animation, matte clay-vinyl texture with velvety fuzz, gentle squishy motion
with subtle squash-and-stretch, pastel colors, static camera, characters keep exactly the
same design, colors and markings as the input image, no text.
```

| # | 動作プロンプト（共通節に続けて） | 背景 |
|---|---|---|
| 1 | `Inuinu the tan dog on the right bounces up and down happily, tail wagging fast, sparkles around; Nekoneko the cream cat on the left gives an unimpressed flat half-lidded look` | cozy living room |
| 2 | `Nekoneko sways gently side to side, relaxed half-lidded eyes, slow blink, beside a water bowl` | soft plain pastel |
| 3 | `Inuinu suddenly perks up with wide surprised eyes, ears flap once, small bounce; Nekoneko leans slightly forward, serious calm face, small emphatic paw tap` | soft plain pastel |
| 4 | `Nekoneko raises one stubby paw as if explaining, confident knowing smile, slight head tilt` | soft plain pastel |
| 5 | `Inuinu perks up with wide surprised eyes and a small bounce; Nekoneko counts on its stubby paw with a confident smile; three pastel icons float gently above them` | soft plain pastel |
| 6 | `Nekoneko sways gently, slow blink; Inuinu nods slowly twice with an understanding expression` | warm soft clinic-like（**赤い十字は絶対に出さない**・ミント/パステルのみ） |
| 7 | `both characters bounce softly in sync, happy closed-eye smiles, warm sparkling atmosphere, tail wagging` | cozy living room |

### リテイク条件（NGならもう一度）

- キャラの**柄が変わった／左右が入れ替わった**（ネコ=左・灰ぶちは左耳／イヌ=右・こげ茶垂れ耳）
- **腕や指が生えた**（このキャラに腕はない。丸い手足のみ）
- テカテカの**プラスチック光沢**になった（マットな粘土/ソフビ質感が正）
- 目が**大きい人間っぽい目**になった（黒い点目が正）
- 画面に**文字が出た**／カメラが動いた
- cut-06 で**赤い十字**が出た（赤十字標章の使用制限に触れるため一発NG）

---

## 完了後

`cut-01.mp4` 〜 `cut-07.mp4` を Kisho に渡す。
→ 音声（VOICEVOX）・テロップ合成・配信キュー生成は、この後 sns-content-engine 側のセッションで実施する。

## 補足

- 台本＝ `content/2026-07-22_cat-ckd/02-script.md`
- 生成仕様の詳細＝ `content/2026-07-22_cat-ckd/05-animate.md`
- Kling が使えない場合の代替: Google Veo 3.1（同じく画像→動画・縦9:16対応）。プロンプトはそのまま流用可
- 無料枠で足りない場合は cut-01（フック）だけ先に作って品質判断してよい
