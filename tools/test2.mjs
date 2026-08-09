import { generate } from './gen.mjs';
import { STYLE_CHAR, TEST } from './style.mjs';
const t0 = Date.now();
try {
  const r = await generate(TEST.shiba + '，' + STYLE_CHAR, 'art-test/shiba_raw.png', '2048x2048');
  console.log('✅ 柴犬', (r.bytes/1024|0)+'KB', ((Date.now()-t0)/1000|0)+'s');
} catch (e) { console.log('❌', e.message.slice(0,400)); }
