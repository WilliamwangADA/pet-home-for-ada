#!/usr/bin/env node
/* 用当前的 key.mjs 参数重新收边：对已抠好的 PNG 再腐蚀一圈，清掉残留粉边。
   （原始 raw 图在抠完后已删除，所以只能在成品上补一刀。） */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dirs = ['assets/art/pets', 'assets/art/furni', 'assets/art/props', 'assets/art/clothes', 'assets/art/bg'];
let n = 0;
for (const d of dirs) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.png') || f.startsWith('bg_')) continue;   // bg_ 是不透明大图，跳过
    const p = path.join(d, f);
    const tmp = p.replace('.png', '_r.png');
    // 只处理带 alpha 的贴纸
    const hasAlpha = execFileSync('magick', [p, '-format', '%A', 'info:']).toString().trim();
    if (hasAlpha !== 'Blend' && hasAlpha !== 'True') continue;
    execFileSync('magick', [p,
      // 半透明边缘里混着品红 → 先把这些像素直接判为透明
      '-channel', 'A', '-morphology', 'Erode', 'Disk:1.5', '-blur', '0x0.5', '+channel',
      '-trim', '+repage', tmp]);
    fs.renameSync(tmp, p);
    n++;
  }
}
console.log(`✅ 收边完成 ${n} 张`);
