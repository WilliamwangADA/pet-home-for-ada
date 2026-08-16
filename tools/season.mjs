#!/usr/bin/env node
/* 四季背景：房间 + 院子 各 4 张。
   用现有的宽版背景当参考图，保证构图/机位/画风完全一致 ——
   否则换季时画面会整个跳掉，地面标定也全废。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './gen.mjs';
import { STYLE_BG } from './style.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const has = (f) => fs.existsSync(f) && fs.statSync(f).size > 3000;

const SAME = '和参考图【完全相同的房间、完全相同的机位和构图、完全相同的家具摆放】，'
  + '地面位置一模一样，只有窗外的景色和光线的季节感不同';
const SAME_P = '和参考图【完全相同的草地、完全相同的机位和构图】，地面位置一模一样，'
  + '只有植被和光线的季节感不同';

const SEASONS = {
  spring: ['春天', '窗外的大树开满了粉白色的樱花，花瓣在风里飘，远处山丘是嫩绿色，田野是新绿的秧苗，'
    + '光线柔和清新带一点粉调',
    '草地是鲜嫩的新绿，树上开满粉色樱花花瓣纷飞，远处山丘嫩绿，开满各色野花，空气清新明亮'],
  summer: ['夏天', '窗外的大树枝叶浓密翠绿，远处山丘深绿，稻田是饱满的绿色，阳光强烈明亮，'
    + '天空湛蓝白云高耸，有夏日午后的通透感',
    '草地是浓郁的深绿，大树枝繁叶茂投下浓重的树荫，天空湛蓝白云高耸，阳光强烈，一派盛夏景象'],
  autumn: ['秋天', '窗外的大树叶子变成金黄和火红，落叶飘飞，远处山丘是层层的红黄橙，'
    + '稻田金黄成熟，光线是温暖的琥珀色，有秋日黄昏的暖意',
    '草地泛着枯黄，树叶变成金黄火红、落叶铺了一地，远处山丘层林尽染，光线温暖的琥珀色'],
  winter: ['冬天', '窗外银装素裹，大树只剩挂着积雪的枝干，远处山丘覆盖白雪，田野是一片雪白，'
    + '天空是冷调的灰蓝色，室内光线偏冷但透着一点暖黄',
    '草地覆盖着一层白雪，树枝挂着积雪只剩枯枝，远处山丘白茫茫，天空冷调灰蓝，安静清冷'],
};

const jobs = [];
for (const [k, [label, homeDesc, parkDesc]] of Object.entries(SEASONS)) {
  jobs.push([`bg_home_${k}`, `日式乡下老房子里宽敞的房间，${SAME}。${label}：${homeDesc}。房间是空的没有宠物没有人`,
    'assets/art/bg/bg_home_wide.jpg']);
  jobs.push([`bg_park_${k}`, `开阔的乡间草地，${SAME_P}。${label}：${parkDesc}。画面里没有任何动物没有人`,
    'assets/art/bg/bg_park_wide.jpg']);
}
let ok = 0, skip = 0, fail = 0;
for (const [id, prompt, ref] of jobs) {
  const out = P('assets/art/bg', `${id}.png`);
  if (has(out) || has(out.replace('.png', '.jpg'))) { skip++; console.log('   ⏭ ', id); continue; }
  let done = false;
  for (let t = 1; t <= 3 && !done; t++) {
    try {
      await generate(prompt + '，' + STYLE_BG, out, '3360x1440', has(P(ref)) ? { ref } : {});
      ok++; console.log('   ✅', id);
      done = true;
    } catch (e) { console.log(`   ⚠️ ${id} 第${t}次:`, e.message.slice(0, 110)); }
  }
  if (!done) fail++;
}
console.log(`\n成功 ${ok} / 跳过 ${skip} / 失败 ${fail}`);
