#!/usr/bin/env python3
# _render_card.py — render.mjs から呼ばれるカード画像生成ヘルパー。
# scenes.json を読み、各カットのテロップ＋セリフを日本語フォントで描いた
# 9:16 PNG を書き出す。Pillow のみ使用。
import sys, json
from PIL import Image, ImageDraw, ImageFont

FONTS = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]

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

def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    W, H = data["W"], data["H"]
    tf, sf = load(84), load(46)
    for sc in data["scenes"]:
        img = Image.new("RGB", (W, H), hexrgb(sc["bg"]))
        d = ImageDraw.Draw(img)
        draw_block(d, W, wrap(d, sc["telop"], tf, W - 160), tf, H * 0.42, (74, 59, 42), 24)
        draw_block(d, W, wrap(d, sc["serifu"], sf, W - 160), sf, H - 320, (138, 109, 79), 14)
        img.save(sc["out"])
    print(f"ok {len(data['scenes'])}")

if __name__ == "__main__":
    main()
