#!/usr/bin/env node
/* 生成更宽的房间/院子背景（21:9）。
   原来是 16:9，8 只宠物挤不下；加宽后左右都有活动空间。 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './gen.mjs';
import { STYLE_BG } from './style.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);

const JOBS = [
  ['bg_home_wide', '一间很宽敞的日式乡下老房子，横向延展的大房间，浅色木地板铺着大片榻榻米，'
    + '正中间是一整面朝向院子的大木格窗敞开着，窗外是翠绿的山丘、一棵茂盛的大树、金色的稻田和蓝天白云，'
    + '房间左边有一个矮木柜上面摆着陶罐、旁边一盆绿色植物，右边有一个木头矮桌和一个竹编篮子、墙上挂着干花，'
    + '午后的阳光从窗户斜射进来在地板上投下明亮的光斑和窗格影子，窗边挂着随风飘动的浅色纱帘，'
    + '房间是空的没有宠物没有人，地面开阔平坦，安静温暖充满生活气息'],
  ['bg_park_wide', '一片非常开阔的乡间草地，横向延展的大草坪，铺满柔软的青草，'
    + '中景左右各有几棵茂盛的大树投下斑驳树影，远处是连绵起伏的绿色山丘和金色田野，'
    + '天空明亮蓝色飘着大朵白云，画面左边有一个清澈小池塘边上开着野花，右边有一张木头长椅和一片野花丛，'
    + '一条浅色小路从画面前方延伸向远处，微风吹过草地泛起波浪，画面里没有任何动物没有人'],
];
for (const [id, prompt] of JOBS) {
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await generate(prompt + '，' + STYLE_BG, P('assets/art/bg', `${id}.png`), '3360x1440');
      console.log('✅', id, (r.bytes / 1024 | 0) + 'KB');
      break;
    } catch (e) { console.log(`  ⚠️ ${id} 第${t}次:`, e.message.slice(0, 130)); }
  }
}
