#!/usr/bin/env python3
"""二次瘦身：素材比游戏里实际显示的尺寸大一大截，iPad 首屏被拖慢。

第一版 optimize.mjs 已经压过一轮（贴纸 720px / 背景 1920px q86），
但按 iPad Pro 最坏情况算：一只宠物最大也就 25vmin ≈ 256 CSS px，
DPR 2 → 512 物理像素，720px 是纯浪费。这一轮按"实际显示 × 2"重新定尺寸。

幂等：ledger 记 (size, mtime)，没变过的跳过，避免反复量化掉色阶。
"""
import json, os, subprocess, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
LEDGER = 'assets/art/.slimmed.json'
done = json.load(open(LEDGER)) if os.path.exists(LEDGER) else {}
force = '--force' in sys.argv

#            目录                  最长边   说明
JOBS = [
    ('assets/art/pets',    512),   # 最大 25vmin ≈ 256 CSS px
    ('assets/art/furni',   380),   # 最大 ~15vmin
    ('assets/art/props',   380),
    ('assets/art/clothes', 320),   # 贴在宠物身上，比宠物还小
]
FG_MAX = 1440                      # 前景遮挡条，只占屏幕下方 34%
JPG_Q  = 76                        # 背景重压（原来 86）

def sig(p):
    st = os.stat(p)
    return f'{st.st_size}:{int(st.st_mtime)}'

before = after = n = 0

def slim_png(p, maxpx):
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    if max(w, h) > maxpx:
        s = maxpx / max(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im.quantize(colors=255, method=Image.FASTOCTREE).save(p, optimize=True)

targets = []
for d, mx in JOBS:
    if os.path.isdir(d):
        targets += [(os.path.join(d, f), mx, 'png') for f in sorted(os.listdir(d)) if f.endswith('.png')]
bg = 'assets/art/bg'
if os.path.isdir(bg):
    targets += [(os.path.join(bg, f), FG_MAX, 'png') for f in sorted(os.listdir(bg)) if f.endswith('.png')]
    targets += [(os.path.join(bg, f), 0, 'jpg') for f in sorted(os.listdir(bg)) if f.endswith('.jpg')]

for p, mx, kind in targets:
    if not force and done.get(p) == sig(p):
        continue
    b = os.path.getsize(p); before += b
    if kind == 'png':
        slim_png(p, mx)
    else:
        subprocess.run(['magick', p, '-quality', str(JPG_Q), '-sampling-factor', '4:2:0',
                        '-strip', '-interlace', 'Plane', p], check=True)
    after += os.path.getsize(p); n += 1
    done[p] = sig(p)

json.dump(done, open(LEDGER, 'w'), indent=1)
mb = lambda x: f'{x / 1048576:.1f}MB'
if n:
    print(f'✅ {n} 张：{mb(before)} → {mb(after)}（省 {100 - after / before * 100:.0f}%）')
else:
    print('没有需要处理的文件（ledger 全命中）')
