#!/usr/bin/env python3
"""生成 App 图标（PIL 画胖柴犬脸）+ 扫码二维码"""
import os
from PIL import Image, ImageDraw
import segno

ROOT = os.path.join(os.path.dirname(__file__), "..")
ICONS = os.path.join(ROOT, "assets", "icons")
URL = "https://williamwangada.github.io/pet-home-for-ada/"
os.makedirs(ICONS, exist_ok=True)

S = 1024
img = Image.new("RGB", (S, S), "#ffe8d1")
d = ImageDraw.Draw(img)

MAIN = "#f09f51"; CREAM = "#fff4e3"; DARK = "#5b3a29"
BLUSH = "#ffb3bd"; COLLAR = "#f25d7e"; BELL = "#f5c542"

def E(cx, cy, rx, ry, fill):
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill)

# 耳朵
d.polygon([(255,330),(300,110),(465,255)], fill=MAIN)
d.polygon([(769,330),(724,110),(559,255)], fill=MAIN)
d.polygon([(300,300),(325,160),(430,260)], fill="#c1753f")
d.polygon([(724,300),(699,160),(594,260)], fill="#c1753f")
# 脸（胖胖的圆）
E(512, 560, 340, 310, MAIN)
# 奶油脸颊/嘴部
E(512, 660, 210, 160, CREAM)
# 眉毛白点
E(400, 430, 26, 26, "#ffffff")
E(624, 430, 26, 26, "#ffffff")
# 开心眯眯眼（两段弧）
for cx in (400, 624):
    d.arc([cx-62, 470, cx+62, 580], start=200, end=340, fill=DARK, width=26)
# 腮红
E(300, 640, 48, 30, BLUSH)
E(724, 640, 48, 30, BLUSH)
# 鼻子 + 嘴 + 舌头
E(512, 610, 34, 26, DARK)
d.line([(512, 625), (512, 660)], fill=DARK, width=18)
d.arc([448, 620, 512, 700], start=20, end=160, fill=DARK, width=18)
d.arc([512, 620, 576, 700], start=20, end=160, fill=DARK, width=18)
d.rounded_rectangle([470, 668, 554, 760], radius=40, fill="#ff8fa3")
d.rectangle([470, 668, 554, 690], fill="#ff8fa3")
# 项圈 + 铃铛
d.arc([232, 560, 792, 950], start=35, end=145, fill=COLLAR, width=56)
E(512, 918, 52, 52, BELL)
d.line([(512, 890), (512, 930)], fill="#c99b1f", width=10)
E(512, 944, 12, 12, "#c99b1f")

for size, name in [(1024, "icon-1024.png"), (512, "icon-512.png"), (192, "icon-192.png"), (180, "icon-180.png")]:
    img.resize((size, size), Image.LANCZOS).save(os.path.join(ICONS, name))
    print(name)

# 二维码（中央嵌 App 图标）
qr = segno.make(URL, error="h")
qr_path = os.path.join(ROOT, "assets", "qrcode.png")
qr.save(qr_path, scale=14, border=2, dark="#7a4f2e", light="#fff6ea")
qimg = Image.open(qr_path).convert("RGB")
logo = img.resize((qimg.width // 4, qimg.width // 4), Image.LANCZOS)
frame = Image.new("RGB", (logo.width + 24, logo.height + 24), "#fff6ea")
frame.paste(logo, (12, 12))
qimg.paste(frame, ((qimg.width - frame.width) // 2, (qimg.height - frame.height) // 2))
qimg.save(qr_path)
print("qrcode.png", qimg.size)
