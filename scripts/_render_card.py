#!/usr/bin/env python3
# _render_card.py — render.mjs から呼ばれるカード画像生成ヘルパー。
# scenes.json を読み、各カットに ネコネコ＆イヌイヌ の簡易アバター＋テロップ＋セリフを
# 日本語フォントで描いた 9:16 PNG を書き出す。Pillow のみ使用。
import sys, json
from PIL import Image, ImageDraw, ImageFont

FONTS = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]
OUT = (74, 59, 42)        # 輪郭・濃い茶
CAT_BODY = (236, 230, 220)
DOG_BODY = (228, 201, 160)
PINK = (232, 160, 160)

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

def halo(d, cx, cy, r):
    d.ellipse([cx - r * 1.25, cy - r * 1.25, cx + r * 1.25, cy + r * 1.25],
              fill=(255, 255, 255))

def draw_cat(d, cx, cy, r, active):
    if active:
        halo(d, cx, cy, r)
    # 耳
    for sx in (-1, 1):
        d.polygon([(cx + sx * 0.75 * r, cy - 0.45 * r),
                   (cx + sx * 1.0 * r, cy - 1.15 * r),
                   (cx + sx * 0.15 * r, cy - 0.85 * r)], fill=CAT_BODY, outline=OUT, width=5)
    # 顔
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CAT_BODY, outline=OUT, width=6)
    # 目（のんびり半目 = 下向きアーチ）
    for sx in (-1, 1):
        ex = cx + sx * 0.38 * r
        d.arc([ex - 0.2 * r, cy - 0.2 * r, ex + 0.2 * r, cy + 0.1 * r], 200, 340, fill=OUT, width=7)
    # 鼻
    d.polygon([(cx - 0.1 * r, cy + 0.15 * r), (cx + 0.1 * r, cy + 0.15 * r), (cx, cy + 0.3 * r)], fill=PINK)
    # ひげ
    for sx in (-1, 1):
        for dy in (-0.05, 0.1):
            d.line([(cx + sx * 0.25 * r, cy + 0.2 * r + dy * r),
                    (cx + sx * 0.95 * r, cy + 0.12 * r + dy * r)], fill=OUT, width=3)

def draw_dog(d, cx, cy, r, active):
    if active:
        halo(d, cx, cy, r)
    # 垂れ耳（顔の後ろ）
    for sx in (-1, 1):
        d.ellipse([cx + sx * 1.15 * r - 0.3 * r, cy - 0.5 * r,
                   cx + sx * 1.15 * r + 0.3 * r, cy + 0.75 * r],
                  fill=(198, 168, 128), outline=OUT, width=5)
    # 顔
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=DOG_BODY, outline=OUT, width=6)
    # 目（ぱっちり）
    for sx in (-1, 1):
        ex = cx + sx * 0.34 * r
        d.ellipse([ex - 0.14 * r, cy - 0.18 * r, ex + 0.14 * r, cy + 0.1 * r], fill=OUT)
        d.ellipse([ex - 0.02 * r, cy - 0.12 * r, ex + 0.06 * r, cy - 0.04 * r], fill=(255, 255, 255))
    # 鼻
    d.ellipse([cx - 0.16 * r, cy + 0.12 * r, cx + 0.16 * r, cy + 0.32 * r], fill=OUT)
    # 舌
    d.rounded_rectangle([cx - 0.12 * r, cy + 0.34 * r, cx + 0.12 * r, cy + 0.6 * r],
                        radius=0.1 * r, fill=PINK)

def draw_duo(d, W, serifu):
    cat_on = "ネコ:" in serifu
    dog_on = "イヌ:" in serifu
    if not cat_on and not dog_on:   # テロップのみのカットは両方ふつう表示
        cat_on = dog_on = True
    cy, r = 300, 132
    draw_cat(d, W / 2 - 170, cy, r, cat_on)
    draw_dog(d, W / 2 + 170, cy, r, dog_on)

def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    W, H = data["W"], data["H"]
    tf, sf = load(84), load(46)
    for sc in data["scenes"]:
        img = Image.new("RGB", (W, H), hexrgb(sc["bg"]))
        d = ImageDraw.Draw(img)
        draw_duo(d, W, sc["serifu"])
        draw_block(d, W, wrap(d, sc["telop"], tf, W - 160), tf, H * 0.44, (74, 59, 42), 24)
        draw_block(d, W, wrap(d, sc["serifu"], sf, W - 160), sf, H - 300, (138, 109, 79), 14)
        img.save(sc["out"])
    print(f"ok {len(data['scenes'])}")

if __name__ == "__main__":
    main()
