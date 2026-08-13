#!/usr/bin/env node
/* 生成的原图是 2048²/2560×1440，游戏里最大也就显示几百 px。
   直接上线会拖垮 iPad 首屏，这里统一降到实际需要的尺寸并压缩。
   贴纸保 alpha 用 PNG（quantize 到 256 色），背景用 JPEG（不需要 alpha）。 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/* 同样必须幂等：重复量化(-colors)会一次次损失色阶。 */
const LOG = 'assets/art/.optimized.json';
const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
const force = process.argv.includes('--force');

const JOBS = [
  { dir: 'assets/art/pets',    max: 720,  kind: 'png' },
  { dir: 'assets/art/furni',   max: 560,  kind: 'png' },
  { dir: 'assets/art/props',   max: 560,  kind: 'png' },
  { dir: 'assets/art/clothes', max: 420,  kind: 'png' },
  { dir: 'assets/art/bg',      max: 1920, kind: 'jpg' },
];

let before = 0, after = 0, n = 0;
for (const j of JOBS) {
  if (!fs.existsSync(j.dir)) continue;
  for (const f of fs.readdirSync(j.dir)) {
    if (!f.endsWith('.png')) continue;
    const p = path.join(j.dir, f);
    const isBG = f.startsWith('bg_');
    const st0 = fs.statSync(p);
    const sig0 = `${st0.size}:${Math.round(st0.mtimeMs)}`;
    if (!force && done[p] === sig0) continue;
    before += st0.size;
    if (j.kind === 'jpg' && isBG) {
      const out = p.replace(/\.png$/, '.jpg');
      execFileSync('magick', [p, '-resize', `${j.max}x>`, '-quality', '86',
        '-sampling-factor', '4:2:0', '-strip', '-interlace', 'Plane', out]);
      fs.unlinkSync(p);
      after += fs.statSync(out).size;
    } else {
      execFileSync('magick', [p, '-resize', `${j.max}x${j.max}>`,
        '-strip', '-define', 'png:compression-level=9',
        '-colors', '200', '-depth', '8', p]);
      after += fs.statSync(p).size;
    }
    const cur = fs.existsSync(p) ? p : p.replace(/\.png$/, '.jpg');
    if (fs.existsSync(cur)) {
      const st1 = fs.statSync(cur);
      done[p] = `${st1.size}:${Math.round(st1.mtimeMs)}`;
    }
    n++;
  }
}
fs.writeFileSync(LOG, JSON.stringify(done, null, 1));
const mb = (x) => (x / 1048576).toFixed(1) + 'MB';
console.log(`✅ ${n} 张：${mb(before)} → ${mb(after)}（省 ${(100 - after / before * 100).toFixed(0)}%）`);
