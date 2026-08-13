import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './gen.mjs';
import { key } from './key.mjs';
import { STYLE_PROP_GREEN } from './style.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const BOWL = '一个可爱的宠物食盆，粉色的陶瓷碗，碗口有一圈厚厚的白色滚边，碗身圆润';
const JOBS = [
  ['bowl_food',  `${BOWL}，碗里装着满满一碗褐色的圆颗粒狗粮，堆得冒尖`],
  ['bowl_half',  `${BOWL}，碗里只剩下小半碗褐色圆颗粒狗粮，碗底露出来一部分`],
  ['bowl_empty', `${BOWL}，碗里是空的，一粒狗粮都没有，能看到干净的碗底`],
];
for (const [id, prompt] of JOBS) {
  const out = P('assets/art/props', `${id}.png`);
  const raw = out.replace(/\.png$/, '_raw.png');
  for (let t = 1; t <= 3; t++) {
    try {
      await generate(prompt + '，' + STYLE_PROP_GREEN, raw, '2048x2048');
      key(raw, out, { bg: 'green' });
      fs.unlinkSync(raw);
      console.log('✅', id);
      break;
    } catch (e) { console.log(`  ⚠️ ${id} 第${t}次:`, e.message.slice(0, 120)); }
  }
}
