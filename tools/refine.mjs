#!/usr/bin/env node
/* 贴纸边缘收紧：把抠图残留的半透明粉边削掉。

   ⚠️ 必须幂等：这个脚本每跑一次就腐蚀一圈 alpha，
   重复跑会把细的部分越吃越薄，最后整块消失
   （食盆的碗体就是这么被吃没的）。
   所以用 .refined.json 记住处理过的文件，跳过已处理的。 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const DIRS = ['assets/art/pets', 'assets/art/furni', 'assets/art/props', 'assets/art/clothes'];
const LOG = 'assets/art/.refined.json';
const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
const force = process.argv.includes('--force');
let n = 0, skip = 0;

for (const d of DIRS) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.png') || f.endsWith('_raw.png')) continue;
    const p = path.join(d, f);
    const st = fs.statSync(p);
    const sig = `${st.size}:${Math.round(st.mtimeMs)}`;
    if (!force && done[p] === sig) { skip++; continue; }
    const hasAlpha = execFileSync('magick', [p, '-format', '%A', 'info:']).toString().trim();
    if (hasAlpha !== 'Blend' && hasAlpha !== 'True') { done[p] = sig; continue; }
    const tmp = p.replace('.png', '_r.png');
    execFileSync('magick', [p,
      '-channel', 'A', '-morphology', 'Erode', 'Disk:1.5', '-blur', '0x0.5', '+channel',
      '-trim', '+repage', tmp]);
    fs.renameSync(tmp, p);
    const st2 = fs.statSync(p);
    done[p] = `${st2.size}:${Math.round(st2.mtimeMs)}`;
    n++;
  }
}
fs.writeFileSync(LOG, JSON.stringify(done, null, 1));
console.log(`✅ 收边 ${n} 张，跳过已处理 ${skip} 张`);
