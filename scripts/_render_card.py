#!/usr/bin/env python3
# _render_card.py — render.mjs から呼ばれるカード画像生成ヘルパー。
# scenes.json を読み、各カットに ネコネコ＆イヌイヌ の簡易アバター＋テロップ＋セリフを
# 日本語フォントで描いた 9:16 PNG を書き出す。Pillow のみ使用。
import sys, json, re
from PIL import Image, ImageDraw, ImageFont

FONTS = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]
OUT = (74, 59, 42)          # 輪郭・濃い茶 #4A3B2A
CAT_BODY = (239, 233, 223)  # #EFE9DF
CAT_PATCH = (191, 180, 164) # #BFB4A4 灰ぶち
DOG_BODY = (228, 201, 160)  # #E4C9A0
DOG_EAR = (143, 107, 68)    # #8F6B44 こげ茶耳
DOG_PATCH = (198, 168, 128) # #C6A880 背中の柄
PINK = (232, 160, 160)      # #E8A0A0
BLUSH = (242, 184, 184)     # #F2B8B8

def load(size):
    for f in FONTS:
        try:
            return ImageFont.truetype(f, size)
        except Exception:
            pass
    return ImageFont.load_default()

def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def wrap(draw, text, font, maxw):
    lines, cur = [], ""
    for ch in text:
        if ch == "\n":
            lines.append(cur); cur = ""; continue
        if draw.textlength(cur + ch, font=font) > maxw and cur:
            lines.append(cur); cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines or [" "]

def draw_block(draw, W, lines, font, cy, color, spacing):
    asc, desc = font.getmetrics()
    lh = asc + desc + spacing
    y = cy - lh * len(lines) / 2
    for ln in lines:
        w = draw.textlength(ln, font=font)
        draw.text(((W - w) / 2, y), ln, font=font, fill=color)
        y += lh

def halo(d, cx, cy, rx, ry):
    d.ellipse([cx - rx * 1.3, cy - ry * 1.22, cx + rx * 1.3, cy + ry * 1.22],
              fill=(255, 255, 255))

# --- 表情の決定 -------------------------------------------------------------
# 台本の「ビジュアル指示」列を →、。/・ で区切り、猫/犬に言及する断片は
# そのキャラへ、どちらにも触れない断片は両方へ効かせる。
CAT_WORDS = ("猫", "ネコ")
DOG_WORDS = ("犬", "イヌ")

def _my_text(vis, mine, other):
    parts = re.split(r"[→、。/・（）()]", vis)
    out = []
    for p in parts:
        is_mine = any(w in p for w in mine)
        is_other = any(w in p for w in other)
        if is_mine or not is_other:
            out.append(p)
    return " ".join(out)

def cat_expr(vis):
    t = _my_text(vis, CAT_WORDS, DOG_WORDS)
    if "びっくり" in t or "驚" in t:
        return "surprised"
    if "心配" in t:
        return "worried"
    if "どや" in t:
        return "smug"
    if any(k in t for k in ("半目", "のんびり", "やれやれ", "真顔")):
        return "halflid"
    return "normal"

def dog_expr(vis):
    t = _my_text(vis, DOG_WORDS, CAT_WORDS)
    if any(k in t for k in ("しょんぼり", "泣", "悲し")):
        return "sad"
    if any(k in t for k in ("ハッ", "びっくり", "驚", "注目")):
        return "surprised"
    if any(k in t for k in ("笑顔", "全力", "うれし", "喜")):
        return "bigsmile"
    return "normal"

# 確定デザイン（案B-4 もちもち豆マスコット・ぶち模様）。docs/character.md / prompts/05-visual.md が正本。
def draw_cat(d, cx, cy, s, active, expr="normal", mouth_open=False):
    rx, ry = 0.8 * s, 1.0 * s
    if active:
        halo(d, cx, cy, rx, ry)
    # 耳（左=灰ぶち #BFB4A4）
    for sx, col in ((-1, CAT_PATCH), (1, CAT_BODY)):
        d.polygon([(cx + sx * 0.52 * s, cy - 0.76 * s),
                   (cx + sx * 0.66 * s, cy - 1.24 * s),
                   (cx + sx * 0.14 * s, cy - 0.97 * s)], fill=col, outline=OUT, width=5)
    # しっぽ玉（右・体の後ろに半分隠す）
    d.ellipse([cx + 0.62 * s, cy + 0.3 * s, cx + 1.02 * s, cy + 0.68 * s],
              fill=CAT_PATCH, outline=OUT, width=5)
    # 豆型ボディ
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=CAT_BODY, outline=OUT, width=6)
    # 左頭のぶち＋右下ボディの斑
    d.chord([cx - 0.8 * s, cy - 1.0 * s, cx + 0.05 * s, cy - 0.2 * s], 150, 330, fill=CAT_PATCH)
    d.ellipse([cx + 0.24 * s, cy + 0.32 * s, cx + 0.62 * s, cy + 0.6 * s], fill=CAT_PATCH)
    # 目（表情で切替）
    for sx in (-1, 1):
        ex = cx + sx * 0.28 * s
        if expr in ("halflid", "smug"):        # のんびり半目
            d.arc([ex - 0.1 * s, cy - 0.43 * s, ex + 0.1 * s, cy - 0.29 * s], 20, 160, fill=OUT, width=5)
        elif expr == "worried":                 # 心配（下がり目）
            d.arc([ex - 0.1 * s, cy - 0.43 * s, ex + 0.1 * s, cy - 0.29 * s], 200, 340, fill=OUT, width=5)
        elif expr == "surprised":               # びっくり（白目リング＋点瞳）
            d.ellipse([ex - 0.11 * s, cy - 0.47 * s, ex + 0.11 * s, cy - 0.25 * s],
                      fill=(255, 255, 255), outline=OUT, width=4)
            d.ellipse([ex - 0.04 * s, cy - 0.4 * s, ex + 0.04 * s, cy - 0.32 * s], fill=OUT)
        else:                                   # 通常の点目
            d.ellipse([ex - 0.075 * s, cy - 0.44 * s, ex + 0.075 * s, cy - 0.29 * s], fill=OUT)
    # 鼻
    d.polygon([(cx - 0.06 * s, cy - 0.16 * s), (cx + 0.06 * s, cy - 0.16 * s), (cx, cy - 0.07 * s)], fill=PINK)
    # 口（口パク > 表情の順で切替）
    if mouth_open:                              # 口パク（開）
        d.ellipse([cx - 0.09 * s, cy - 0.13 * s, cx + 0.09 * s, cy + 0.05 * s], fill=OUT)
        d.ellipse([cx - 0.05 * s, cy - 0.04 * s, cx + 0.05 * s, cy + 0.04 * s], fill=PINK)
    elif expr == "surprised":                   # 小さな「お」の口
        d.ellipse([cx - 0.06 * s, cy - 0.1 * s, cx + 0.06 * s, cy + 0.02 * s],
                  fill=None, outline=OUT, width=4)
    elif expr == "smug":                        # どやスマイル
        d.arc([cx - 0.14 * s, cy - 0.16 * s, cx + 0.14 * s, cy + 0.02 * s], 20, 160, fill=OUT, width=4)
    else:                                       # ω口
        d.arc([cx - 0.16 * s, cy - 0.14 * s, cx, cy + 0.02 * s], 20, 160, fill=OUT, width=4)
        d.arc([cx, cy - 0.14 * s, cx + 0.16 * s, cy + 0.02 * s], 20, 160, fill=OUT, width=4)
    # ほっぺ
    for sx in (-1, 1):
        d.ellipse([cx + sx * 0.52 * s - 0.11 * s, cy - 0.12 * s,
                   cx + sx * 0.52 * s + 0.11 * s, cy + 0.1 * s], fill=BLUSH)
    # 手足
    for sx in (-1, 1):
        d.ellipse([cx + sx * 0.28 * s - 0.18 * s, cy + 0.85 * s,
                   cx + sx * 0.28 * s + 0.18 * s, cy + 1.08 * s], fill=CAT_BODY, outline=OUT, width=5)

def draw_dog(d, cx, cy, s, active, expr="normal", mouth_open=False):
    rx, ry = 0.8 * s, 1.0 * s
    if active:
        halo(d, cx, cy, rx, ry)
    # こげ茶垂れ耳 #8F6B44（しょんぼり時はさらに下がる）
    ear_dy = 0.14 * s if expr == "sad" else 0.0
    for sx in (-1, 1):
        d.ellipse([cx + sx * 0.72 * s - 0.24 * s, cy - 1.05 * s + ear_dy,
                   cx + sx * 0.72 * s + 0.24 * s, cy - 0.1 * s + ear_dy], fill=DOG_EAR, outline=OUT, width=5)
    # しっぽ玉（左・体の後ろに半分隠す）
    d.ellipse([cx - 1.02 * s, cy + 0.24 * s, cx - 0.62 * s, cy + 0.62 * s],
              fill=DOG_EAR, outline=OUT, width=5)
    # 豆型ボディ
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=DOG_BODY, outline=OUT, width=6)
    # 左下背中の柄 #C6A880
    d.ellipse([cx - 0.64 * s, cy + 0.3 * s, cx - 0.08 * s, cy + 0.72 * s], fill=DOG_PATCH)
    # まゆ点・目（表情で切替）
    for sx in (-1, 1):
        ex = cx + sx * 0.28 * s
        d.ellipse([ex - 0.05 * s, cy - 0.72 * s, ex + 0.05 * s, cy - 0.62 * s], fill=OUT)
        if expr == "sad":                       # 下がり目
            d.arc([ex - 0.1 * s, cy - 0.47 * s, ex + 0.1 * s, cy - 0.33 * s], 200, 340, fill=OUT, width=5)
        elif expr == "surprised":               # びっくり（白目リング＋点瞳）
            d.ellipse([ex - 0.11 * s, cy - 0.51 * s, ex + 0.11 * s, cy - 0.29 * s],
                      fill=(255, 255, 255), outline=OUT, width=4)
            d.ellipse([ex - 0.04 * s, cy - 0.44 * s, ex + 0.04 * s, cy - 0.36 * s], fill=OUT)
        else:                                   # 通常の点目
            d.ellipse([ex - 0.075 * s, cy - 0.48 * s, ex + 0.075 * s, cy - 0.33 * s], fill=OUT)
    # 鼻
    d.ellipse([cx - 0.1 * s, cy - 0.28 * s, cx + 0.1 * s, cy - 0.12 * s], fill=OUT)
    # 口（口パク > 表情の順で切替）
    if mouth_open:                              # 口パク（開）
        d.ellipse([cx - 0.11 * s, cy - 0.1 * s, cx + 0.11 * s, cy + 0.12 * s], fill=OUT)
        d.ellipse([cx - 0.06 * s, cy + 0.0 * s, cx + 0.06 * s, cy + 0.1 * s], fill=PINK)
    elif expr == "bigsmile":                    # 全力の笑い口＋舌
        d.pieslice([cx - 0.17 * s, cy - 0.16 * s, cx + 0.17 * s, cy + 0.12 * s], 0, 180, fill=OUT)
        d.rounded_rectangle([cx - 0.08 * s, cy - 0.02 * s, cx + 0.08 * s, cy + 0.18 * s],
                            radius=0.06 * s, fill=PINK)
    elif expr == "sad":                         # への字
        d.arc([cx - 0.13 * s, cy - 0.08 * s, cx + 0.13 * s, cy + 0.1 * s], 200, 340, fill=OUT, width=4)
    elif expr == "surprised":                   # 小さな「お」の口
        d.ellipse([cx - 0.06 * s, cy - 0.1 * s, cx + 0.06 * s, cy + 0.02 * s],
                  fill=None, outline=OUT, width=4)
    else:                                       # にこ口
        d.arc([cx - 0.16 * s, cy - 0.18 * s, cx + 0.16 * s, cy + 0.06 * s], 20, 160, fill=OUT, width=4)
    # ほっぺ
    for sx in (-1, 1):
        d.ellipse([cx + sx * 0.52 * s - 0.11 * s, cy - 0.2 * s,
                   cx + sx * 0.52 * s + 0.11 * s, cy + 0.02 * s], fill=BLUSH)
    # 手足
    for sx in (-1, 1):
        d.ellipse([cx + sx * 0.28 * s - 0.18 * s, cy + 0.85 * s,
                   cx + sx * 0.28 * s + 0.18 * s, cy + 1.08 * s], fill=DOG_BODY, outline=OUT, width=5)

def draw_duo(d, W, serifu, vis="", phase=0):
    cat_on = "ネコ:" in serifu
    dog_on = "イヌ:" in serifu
    if not cat_on and not dog_on:   # テロップのみのカットは両方ふつう表示
        cat_on = dog_on = True
    cy, s = 330, 150
    # 正本レイアウト：ネコ左・イヌ右（05-visual.md）。表情はビジュアル指示列から。
    # phase=1: 話者は口パク（開）＋ぴょこっと浮く 2コマアニメの2枚目。
    bob = -10 if phase else 0
    draw_cat(d, W / 2 - 175, cy + (bob if cat_on else 0), s, cat_on,
             cat_expr(vis), mouth_open=bool(phase and cat_on))
    draw_dog(d, W / 2 + 175, cy + (bob if dog_on else 0), s, dog_on,
             dog_expr(vis), mouth_open=bool(phase and dog_on))

def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    W, H = data["W"], data["H"]
    tf, sf = load(84), load(46)
    for sc in data["scenes"]:
        outs = sc.get("outs") or [sc["out"]]
        for phase, out in enumerate(outs):
            img = Image.new("RGB", (W, H), hexrgb(sc["bg"]))
            d = ImageDraw.Draw(img)
            draw_duo(d, W, sc["serifu"], sc.get("vis", ""), phase)
            draw_block(d, W, wrap(d, sc["telop"], tf, W - 160), tf, H * 0.44, (74, 59, 42), 24)
            draw_block(d, W, wrap(d, sc["serifu"], sf, W - 160), sf, H - 300, (138, 109, 79), 14)
            img.save(out)
    print(f"ok {len(data['scenes'])}")

if __name__ == "__main__":
    main()
