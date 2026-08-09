/* SW：核心文件 stale-while-revalidate 秒开，素材缓存优先，首访后离线可玩 */
const VER = 'pet-home-v0.6.1';
const CORE = [
  './', 'index.html', 'css/main.css',
  'js/main.js', 'js/stage.js', 'js/pet.js', 'js/data.js', 'js/audio.js', 'js/save.js',
  'manifest.webmanifest',
];
const ART = [
  'bg/bg_home.jpg', 'bg/bg_park.jpg', 'bg/bg_adopt.jpg',
  ...['shiba','corgi','golden','bichon','calico','orange','gray','tuxedo']
      .flatMap(b => ['idle','walk','sit','sleep','happy'].map(p => `pets/${b}_${p}.png`)),
  ...['bed','cushion','ball','yarn','bone','plant','lamp','frame'].map(f => `furni/${f}.png`),
  ...['bowl_food','bowl_water','tub','elf','butterfly','bubble'].map(f => `props/${f}.png`),
  ...['bow','strawhat','partyhat','flower','scarf','bowtie','glasses','wings'].map(f => `clothes/${f}.png`),
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
    // 后台预缓存配音，失败不影响游戏
    const c = await caches.open(VER);
    // 先缓存美术（首屏最需要），再缓存配音
    for (const u of ART) c.add(u).catch(() => {});
    VOICES.forEach(u => c.add(u).catch(() => {}));
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isAsset = url.pathname.includes('/assets/');
  if (isAsset) {
    // 素材：缓存优先
    e.respondWith(caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => {
        if (res.ok) { const cl = res.clone(); caches.open(VER).then(c => c.put(e.request, cl)); }
        return res;
      })));
  } else {
    // 核心：先用缓存秒开，后台更新
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok) { const cl = res.clone(); caches.open(VER).then(c => c.put(e.request, cl)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
