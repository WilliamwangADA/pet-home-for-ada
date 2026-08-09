#!/usr/bin/env node
/* =====================================================================
   批量生成全部美术素材（可断点续跑：已存在且够大的文件自动跳过）

   用法:
     node tools/batch.mjs bg            只做背景
     node tools/batch.mjs pets          只做 8 品种 × 5 姿态
     node tools/batch.mjs pets:shiba    只做某个品种
     node tools/batch.mjs furni props clothes
     node tools/batch.mjs all

   一致性策略：每个品种先生成 idle 当"锚"，其余姿态把 idle 当参考图传进去，
   保证 5 张是同一只狗，而不是 5 只长得像的狗。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './gen.mjs';
import { key } from './key.mjs';
import { STYLE_BG, STYLE_CHAR, STYLE_PROP, STYLE_FG } from './style.mjs';
import { BREEDS, POSES, POSE_KEYS, FURNI, PROPS, CLOTHES, BG, FG } from './assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const has = (f) => fs.existsSync(f) && fs.statSync(f).size > 3000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, skip = 0, fail = 0;
const failed = [];

async function retry(fn, label, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try { return await fn(); }
    catch (e) {
      console.log(`   ⚠️  ${label} 第${i}次失败: ${e.message.slice(0, 150)}`);
      if (i === tries) { fail++; failed.push(label); return null; }
      await sleep(4000 * i);
    }
  }
}

/** 生成带透明底的贴纸 */
async function sticker(prompt, style, out, label, ref) {
  if (has(out)) { skip++; console.log(`   ⏭  ${label}`); return out; }
  const raw = out.replace(/\.png$/, '_raw.png');
  const opts = ref && has(ref) ? { ref: path.relative(ROOT, ref) } : {};
  const r = await retry(() => generate(prompt + '，' + style, raw, '2048x2048', opts), label);
  if (!r) return null;
  try {
    key(raw, out);
    fs.unlinkSync(raw);
    ok++; console.log(`   ✅ ${label}`);
    return out;
  } catch (e) {
    fail++; failed.push(label);
    console.log(`   ❌ 抠图失败 ${label}: ${e.message.slice(0, 120)}`);
    return null;
  }
}

/** 生成不透明大背景 */
async function bg(prompt, out, label) {
  if (has(out)) { skip++; console.log(`   ⏭  ${label}`); return; }
  const r = await retry(() => generate(prompt + '，' + STYLE_BG, out, '2560x1440'), label);
  if (r) { ok++; console.log(`   ✅ ${label}`); }
}

/* ---------------- 各组 ---------------- */
async function doBG() {
  console.log('\n=== 场景背景 ===');
  for (const [k, v] of Object.entries(BG)) { await bg(v, P('assets/art/bg', `${k}.png`), k); await sleep(1200); }
  console.log('\n=== 前景遮挡层 ===');
  for (const [k, v] of Object.entries(FG)) {
    await sticker(v, STYLE_FG, P('assets/art/bg', `${k}.png`), k);
    await sleep(1200);
  }
}

async function doPets(only) {
  const keys = only ? [only] : Object.keys(BREEDS);
  for (const bk of keys) {
    const b = BREEDS[bk];
    if (!b) { console.log(`   ❓ 没有品种 ${bk}`); continue; }
    console.log(`\n=== ${b.label} (${bk}) ===`);
    const anchor = P('assets/art/pets', `${bk}_idle.png`);
    // 锚：正面站立
    await sticker(`${b.base}，${POSES.idle}`, STYLE_CHAR, anchor, `${b.label} idle`);
    await sleep(1500);
    // 其余姿态引用锚图，保证是同一只
    for (const pk of POSE_KEYS) {
      if (pk === 'idle') continue;
      const out = P('assets/art/pets', `${bk}_${pk}.png`);
      const prompt = `参考图里的这只小动物，保持完全一样的品种、毛色、花纹和五官特征。${b.base}，${POSES[pk]}`;
      await sticker(prompt, STYLE_CHAR, out, `${b.label} ${pk}`, anchor);
      await sleep(1500);
    }
  }
}

async function doMap(map, sub, label, style = STYLE_PROP) {
  console.log(`\n=== ${label} ===`);
  for (const [k, v] of Object.entries(map)) {
    await sticker(v, style, P('assets/art', sub, `${k}.png`), `${label} ${k}`);
    await sleep(1200);
  }
}

/* ---------------- 入口 ---------------- */
const args = process.argv.slice(2);
if (!args.length) {
  console.log('用法: node tools/batch.mjs [bg|pets|pets:<品种>|furni|props|clothes|all]');
  process.exit(0);
}
const t0 = Date.now();
for (const a of args) {
  if (a === 'all') { await doBG(); await doPets(); await doMap(FURNI, 'furni', '家具'); await doMap(PROPS, 'props', '道具'); await doMap(CLOTHES, 'clothes', '服饰'); }
  else if (a === 'bg') await doBG();
  else if (a === 'pets') await doPets();
  else if (a.startsWith('pets:')) await doPets(a.slice(5));
  else if (a === 'furni') await doMap(FURNI, 'furni', '家具');
  else if (a === 'props') await doMap(PROPS, 'props', '道具');
  else if (a === 'clothes') await doMap(CLOTHES, 'clothes', '服饰');
  else console.log(`❓ 不认识的参数 ${a}`);
}
console.log(`\n========== 完成 ==========`);
console.log(`成功 ${ok} / 跳过 ${skip} / 失败 ${fail}   用时 ${((Date.now() - t0) / 60000).toFixed(1)} 分钟`);
if (failed.length) console.log('失败清单（重跑本命令会自动续上）:\n  ' + failed.join('\n  '));
