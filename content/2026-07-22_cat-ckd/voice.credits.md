# 音声クレジット（投稿時に必須）

`cat-ckd_reel_voiced.mp4` の音声は **HTS Voice "Mei"** で合成している。
このボイスは **CC BY 3.0** ＝ **表示（Attribution）が義務**。商用利用・改変は可能だが、
**クレジットを省略して投稿してはいけない。**

## キャプション末尾に貼る文（コピペ用）

```
音声合成: Open JTalk / HTS Voice "Mei" (C) 2009-2013 Nagoya Institute of Technology, MMDAgent Project Team — CC BY 3.0 https://creativecommons.org/licenses/by/3.0/
```

文字数を詰めたい媒体（TikTok / IG）向けの短縮形:

```
音声: Open JTalk / HTS Voice "Mei" (C) Nagoya Institute of Technology — CC BY 3.0
```

> ⚠️ 短縮形でも「Mei」「Nagoya Institute of Technology」「CC BY 3.0」の3点は落とさないこと。
> CC BY は「著作者・作品名・ライセンス」の表示を求めている。

## 内訳

| 構成要素 | ライセンス | クレジット |
|---|---|---|
| pyopenjtalk 0.4.1 | MIT | 不要 |
| Open JTalk / HTS Engine API | 修正BSD | 不要 |
| 辞書（NAIST Japanese Dic / UniDic） | 修正BSD | 不要 |
| **HTS Voice "Mei"** | **CC BY 3.0** | **必要** |

## VOICEVOX に載せ替える場合

VOICEVOX は**キャラクターごとに利用規約が異なり、いずれもクレジット表記が必須**
（例: 「VOICEVOX:四国めたん」）。載せ替えたらこのファイルを必ず書き換えること。
なお `pip install voicevox_core` は PyPI に無く、GitHub Releases の wheel ＋
ONNX ランタイム ＋ 音声モデル（.vvm）の個別取得が必要。
