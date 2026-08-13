#!/usr/bin/env node
/* =====================================================================
   抠底：品红/粉底 → 透明

   三步，缺一不可：
   ① 四角 floodfill  —— 清掉和边缘连通的背景
   ② 全局色距遮罩    —— 清掉被主体围住的内孔（腿之间、把手里面…），
                        floodfill 到不了那儿
   ③ 边缘去溢色      —— 半透明边缘像素里混着品红，不处理就是一圈粉边。
                        对 R、B 明显高于 G 的像素，把 R/B 压回 G 附近。
   ===================================================================== */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

/* bg: 'magenta'(默认) | 'green'
   粉色/红色主体必须用绿幕 —— 粉色碗的暗部和品红背景色距太近，
   会被当成背景抠掉，碗体整个消失（食盆就是这么坏的）。 */
export function key(src, out, { fuzz = 34, shrink = 2, bg = 'magenta' } = {}) {
  const t1 = out.replace(/\.png$/, '_k1.png');
  const t2 = out.replace(/\.png$/, '_k2.png');
  const msk = out.replace(/\.png$/, '_km.png');

  // ① 外围连通背景
  execFileSync('magick', [src, '-alpha', 'set',
    '-bordercolor', bg === 'green' ? '#00FF00' : 'magenta', '-border', '1',
    '-fuzz', `${fuzz}%`, '-fill', 'none', '-draw', 'alpha 0,0 floodfill',
    '-shave', '1x1', t1]);

  // ② 内孔：判定"品红特征"（红高、蓝中高、绿明显低）
  const FX = bg === 'green'
    ? '(g>0.55 && r<0.72 && b<0.72 && (g-r)>0.18 && (g-b)>0.18) ? 0 : a'
    : '(r>0.70 && b>0.30 && b<0.78 && g<0.58 && (r-g)>0.26 && (b-g)>0.02) ? 0 : a';
  execFileSync('magick', [t1, '-channel', 'A', '-fx', FX, '-separate', '+channel', msk]);
  // 遮罩收一圈，把半透明的粉色边也切掉
  if (shrink > 0) {
    execFileSync('magick', [msk, '-morphology', 'Erode', `Disk:${shrink}`, '-blur', '0x0.6', msk]);
  }
  execFileSync('magick', [t1, msk, '-alpha', 'off',
    '-compose', 'copy_opacity', '-composite', t2]);

  /* ③ 边缘去溢色：半透明边缘混着品红，会看成一圈粉边。
     用 -fx 逐像素判定太慢（2048² 要几十秒），改成直接把边缘腐蚀掉 ——
     2048px 上切掉 2px，缩到游戏里的几百 px 完全看不出来。 */
  execFileSync('magick', [t2, '-trim', '+repage', out]);

  for (const f of [t1, t2, msk]) if (fs.existsSync(f)) fs.unlinkSync(f);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , src, out] = process.argv;
  key(src, out);
  console.log('✅', out);
}
