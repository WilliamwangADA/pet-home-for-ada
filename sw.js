/* SW：核心文件 stale-while-revalidate 秒开，素材缓存优先，首访后离线可玩 */
const VER = 'pet-home-v0.1.0';
const CORE = [
  './', 'index.html', 'css/main.css',
  'js/main.js', 'js/art.js', 'js/audio.js', 'js/save.js',
  'manifest.webmanifest',
];
const VOICES = ['welcome','pick','adopt_done','home_first','hungry','dirty','feed_done',
  'bath_start','bath_done','brush_start','brush_done','stroke1','sleep','wake',
  'shop_open','placed','no_hearts','play','elf1','elf2','bark','bark2']
  .map(n => `assets/audio/${n}.mp3`);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k)));
    await self.clients.claim();
    // 后台预缓存配音，失败不影响游戏
    const c = await caches.open(VER);
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
