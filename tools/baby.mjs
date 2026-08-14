#!/usr/bin/env node
/* 生成 8 个品种的幼崽贴图。用各品种的成年 idle 当参考图，
   保证毛色花纹是同一个品种的孩子，而不是 8 只不相干的小动物。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './gen.mjs';
import { key } from './key.mjs';
import { STYLE_CHAR } from './style.mjs';
import { BREEDS, BABY } from './assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const has = (f) => fs.existsSync(f) && fs.statSync(f).size > 3000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, skip = 0, fail = 0;
for (const [bk, b] of Object.entries(BREEDS)) {
  const out = P('assets/art/pets', `${bk}_baby.png`);
  if (has(out)) { skip++; console.log('   ⏭ ', b.label); continue; }
  const anchor = P('assets/art/pets', `${bk}_idle.png`);
  const prompt = `参考图里这只小动物的【宝宝】，保持完全一样的品种、毛色和花纹特征。`
    + `${b.base}，${BABY}`;
  const raw = out.replace(/\.png$/, '_raw.png');
  let done = false;
  for (let t = 1; t <= 3 && !done; t++) {
    try {
      await generate(prompt + '，' + STYLE_CHAR, raw, '2048x2048',
        has(anchor) ? { ref: path.relative(ROOT, anchor) } : {});
      key(raw, out);
      fs.unlinkSync(raw);
      ok++; console.log('   ✅', b.label, '宝宝');
      done = true;
    } catch (e) { console.log(`   ⚠️ ${b.label} 第${t}次:`, e.message.slice(0, 110)); }
  }
  if (!done) fail++;
  await sleep(1500);
}
console.log(`\n成功 ${ok} / 跳过 ${skip} / 失败 ${fail}`);
