import { generate } from './gen.mjs';
import { STYLE_BG, STYLE_CHAR, TEST } from './style.mjs';
const t0 = Date.now();
try {
  const r = await generate(TEST.room + '，' + STYLE_BG, 'art-test/bg_room.png', '2560x1440');
  console.log('✅ 背景', (r.bytes/1024|0)+'KB', ((Date.now()-t0)/1000|0)+'s');
} catch (e) { console.log('❌ 背景:', e.message.slice(0,400)); }
