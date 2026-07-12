#!/usr/bin/env python3
# make_icon.py — SNSプロフィール用アイコン(1080x1080)を確定デザイン(B-4)で生成。
# 使い方: python3 scripts/make_icon.py [出力パス]  （既定: assets/icon.png）
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _render_card import draw_cat, draw_dog, hexrgb
from PIL import Image, ImageDraw

SIZE = 1080
BG = "#FDE9D9"  # ブランドの基調パステル

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "icon.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img = Image.new("RGB", (SIZE, SIZE), hexrgb(BG))
    d = ImageDraw.Draw(img)
    # ネコ左・イヌ右（正本レイアウト）。ハロなし・通常表情。
    draw_cat(d, 260, 560, 240, False)
    draw_dog(d, 820, 560, 240, False)
    img.save(out)
    print(f"ok {out}")

if __name__ == "__main__":
    main()
