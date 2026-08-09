import { generate } from './gen.mjs';
import { TEST } from './style.mjs';
/* 变体B：更贴近吉卜力原作 —— 细软线条、绘画感上色，而不是粗黑描边的赛璐璐 */
const STYLE_B = [
  '吉卜力工作室动画电影的角色作画，宫崎骏动画里的小动物',
  '手绘水彩上色，柔软细腻的线条（不要粗黑描边），颜色有笔触和渐层，阴影柔和偏青绿',
  '毛发有蓬松的绘画质感，绝对不要3D渲染、不要CG、不要塑料光泽',
  '非常可爱讨喜，圆润柔软，又大又圆水汪汪有神的眼睛，温柔的表情',
  '完整全身，主体居中，不接触画面边缘',
  '背景是完全均匀的纯品红色#FF00FF，背景绝对不要有渐变、光晕或发光',
  '没有任何文字',
].join('，');
const r = await generate(TEST.shiba + '，' + STYLE_B, 'art-test/shiba_b_raw.png', '2048x2048');
console.log('✅', (r.bytes/1024|0)+'KB');
