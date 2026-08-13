#!/usr/bin/env node
/* 把贴纸【内部】的半透明区域填实。

   抠图时的色距遮罩会把宠物身上和背景色相近的像素（舌头、腮红、
   浅色毛发）误判成背景，遮罩上留下零散的洞；再一模糊就扩散成
   大片半透明 —— 画面上就是"身体中间虚掉了、能看见背景"。

   做法：从边缘洪泛标出真正的"外部"，其余（主体 + 被主体包围的洞）
   一律设为不透明，只在最外一圈保留 1px 羽化。
   眼镜片/泡泡这种需要内部透明的不处理。 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SKIP = new Set(['bubble.png', 'glasses.png']);
const DIRS = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const dirs = DIRS.length ? DIRS : ['assets/art/pets', 'assets/art/furni', 'assets/art/props', 'assets/art/clothes'];
let n = 0;

for (const d of dirs) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.png') || SKIP.has(f)) continue;
    const p = path.join(d, f);
    const A = '/tmp/_s_a.png', OUT = '/tmp/_s_o.png', EX = '/tmp/_s_e.png';
    // ① alpha → 二值：不透明=白
    execFileSync('magick', [p, '-alpha', 'extract', '-threshold', '35%', A]);
    // ② 从边缘洪泛：把和边缘连通的黑（真外部）涂成灰
    execFileSync('magick', [A, '-bordercolor', 'black', '-border', '1',
      '-fill', 'gray50', '-draw', 'color 0,0 floodfill', '-shave', '1x1', EX]);
    // ③ 灰=外部 → 黑；其余(白=主体 / 黑=内部洞) → 白，得到实心掩码
    execFileSync('magick', [EX, '-fuzz', '10%', '-fill', 'white', '-opaque', 'black',
      '-fill', 'black', '-opaque', 'gray50', '-blur', '0x0.6', OUT]);
    // ④ 换上新 alpha
    execFileSync('magick', [p, OUT, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
      '-trim', '+repage', p]);
    n++;
  }
}
console.log(`✅ 内部填实 ${n} 张`);
