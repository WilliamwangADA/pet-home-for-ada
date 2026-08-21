/* SW：核心文件 stale-while-revalidate 秒开，素材缓存优先，首访后离线可玩 */
const VER = 'pet-home-v0.13.2';
const CORE = [
  './', 'index.html', 'css/main.css',
  'js/main.js', 'js/stage.js', 'js/world.js', 'js/pet.js', 'js/phys.js', 'js/data.js', 'js/audio.js', 'js/save.js',
  'manifest.webmanifest',
];
/* 预缓存分档：越靠前越早囤。
   顺序＝孩子最可能先看到什么：现在这屏的背景 → 宠物 → 家具道具 →
   换季才用得上的背景 → 配音。一次性全开会把首屏的图挤到队尾。 */
const ART = [
  /* 只囤游戏真会去请求的。bg_home/park.jpg、*_wide.jpg、fg_*.png 是早几版
     留下的，现在代码里一次都没引用（背景走 world.bgFor 的季节图，前景层
     stage.setScene 没传 fg 就整层关掉了）—— 以前照样每台设备白下 1.7MB。
     文件先留在仓库里，哪天前景层回来了直接加回这张表。 */
  'bg/bg_adopt.jpg',
  ...['shiba','corgi','golden','bichon','calico','orange','gray','tuxedo']
      .flatMap(b => ['idle','idle_b','walk','walk_b','sit','sleep','happy','happy_b','baby']
        .map(p => `pets/${b}_${p}.png`)),
  ...['bed','cushion','ball','yarn','bone','plant','lamp','frame'].map(f => `furni/${f}.png`),
  ...['bowl_food','bowl_half','bowl_empty','bowl_water','tub','elf','butterfly','bubble'].map(f => `props/${f}.png`),
  ...['bow','strawhat','partyhat','flower','scarf','bowtie','glasses','wings'].map(f => `clothes/${f}.png`),
  ...['spring','summer','autumn','winter'].flatMap(s => [`bg/bg_home_${s}.jpg`, `bg/bg_park_${s}.jpg`]),
].map(f => `assets/art/${f}`);

const VOICES = ['welcome','pick','adopt_done','home_first','hungry','dirty','feed_done',
  'bath_start','bath_done','brush_start','brush_done','stroke1','sleep','wake',
  'shop_open','placed','no_hearts','play','elf1','elf2','bark','bark2',
  'park_out','park_go','park_home','park_ball','park_fetch','park_friend',
  'park_butterfly','dress_open','dress_on','adopt_open','adopt_new','buddies','meow','meow2']
  .map(n => `assets/audio/${n}.mp3`);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k)));
    await self.clients.claim();
    /* 关键：核心文件走 stale-while-revalidate，页面首屏拿到的是【旧】缓存。
       版本更新时旧 main.js 会去 import 已经删掉的模块 → 整个游戏起不来
       （用户遇到的"院子去不了"就是这么来的）。所以新 SW 接管后，
       主动通知页面重载一次，让它换上新代码。 */
    const cs = await self.clients.matchAll({ type: 'window' });
    for (const c of cs) c.postMessage({ type: 'sw-updated', ver: VER });
  })());
});

/* ---------------- 后台囤货 ----------------
   以前是 activate 里 `for (const u of ART) c.add(u)` —— 140 多个请求
   同一瞬间全部开火，把首屏那张背景和 8 只小猫小狗挤到队尾，
   孩子只能盯着爪印加载页干等。现在改成：
     ① 等页面把第一屏画出来了，主动发消息过来才开始
     ② 同时最多 3 个请求，抢不走前台的带宽
     ③ 按重要性排队，先囤马上要用的 */
let warming = false;
async function warmCache() {
  if (warming) return;
  warming = true;
  const list = [...ART, ...VOICES];
  const c = await caches.open(VER);
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const u = list[i++];
      try {
        if (await c.match(u)) continue;          // 已经在缓存里就跳过
        const r = await fetch(u);
        if (r.ok) await c.put(u, r);
      } catch (e) { /* 单张失败不影响游戏 */ }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'precache') e.waitUntil(warmCache());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isAsset = url.pathname.includes('/assets/');

  if (isAsset) {
    /* 图片和音频：内容不会变，缓存优先，秒开 */
    e.respondWith(caches.match(e.request).then((hit) => hit
      || fetch(e.request).then((res) => {
        if (res.ok) { const cl = res.clone(); caches.open(VER).then((c) => c.put(e.request, cl)); }
        return res;
      })));
    return;
  }

  /* 代码（html/js/css）：网络优先。
     以前这里是"缓存优先、后台更新"，结果每次改完代码，用户打开
     看到的还是上一版 —— 改了半天用户一点感觉不到，就是栽在这。
     现在改成先拿网络，拿不到（离线）才回落缓存，离线可玩性不变。 */
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request, { cache: 'no-store' });
      if (res && res.ok) {
        const cl = res.clone();
        caches.open(VER).then((c) => c.put(e.request, cl));
      }
      return res;
    } catch (err) {
      const hit = await caches.match(e.request);
      if (hit) return hit;
      throw err;
    }
  })());
});
