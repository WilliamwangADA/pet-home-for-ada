/* ============ Ada的宠物小窝 · 主逻辑 v0.9.0（2.5D 手绘 + 真物理 + 换装）============ */
export const VERSION = 'v0.9.0';
import { Stage, Actor, ART } from './stage.js';
import { Pet } from './pet.js';
import { BREEDS, FURNI, CLOTHES, isCat } from './data.js';
import { sfx, voice, petVoice } from './audio.js';
import { state, load, save, activePet } from './save.js';
import { Phys, Body, dist } from './phys.js';

const game = document.getElementById('game');
const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const QS0 = new URLSearchParams(location.search);
const SPD = +(QS0.get('speed') || 0);
const MAX_PETS = 4;
const ADOPT_PRICE = [0, 40, 70, 110];

/* 场景固定点位（地面坐标 u 横向 / v 纵深，v=1 最近） */
const TUB_W = 48;          // 浴缸宽度（vmin）
const BATH_LIFT = 0.44;    // 宠物在缸里的抬高量（占缸高比例）
const SPOT = {
  bowl: { u: 0.20, v: 0.74 },
  water: { u: 0.40, v: 0.60 },
  tub: { u: 0.74, v: 0.62 },
};

const stage = new Stage(game);
/* 2.5D 物理世界：地面是 (u,v) 平面，玩具还有离地高度 h */
const phys = new Phys();
phys.onImpact = onImpact;
const fxLayer = $('<div id="fx"></div>');
game.appendChild(fxLayer);

let pets = [], friend = null, nurseryPets = [];
let sceneName = 'home';
let nightOn = false, bathOpen = false, groomMode = false;
const APet = () => pets[state.active] || pets[0];

/* ---------------- 粒子 ---------------- */
function particle(x, y, emoji, n = 1) {
  for (let i = 0; i < n; i++) {
    const p = $(`<div class="pfx">${emoji}</div>`);
    p.style.left = x + 'px'; p.style.top = y + 'px';
    p.style.setProperty('--dx', rand(-9, 9) + 'vmin');
    p.style.setProperty('--dy', rand(-14, -6) + 'vmin');
    p.style.fontSize = rand(3, 5.5) + 'vmin';
    fxLayer.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}
function particleAt(a, emoji, n = 1) {
  const r = a.el.getBoundingClientRect();
  particle(r.left + r.width / 2, r.top + r.height * 0.12, emoji, n);
}

let heartPill;
function addHearts(n, at) {
  state.hearts += n; save();
  if (heartPill) {
    heartPill.querySelector('.hnum').textContent = Math.round(state.hearts);
    heartPill.classList.remove('pulse'); void heartPill.offsetWidth;
    heartPill.classList.add('pulse');
  }
  sfx.coin();
  if (at) particleAt(at, '💗', Math.min(n, 5));
}

/* ---------------- 小精灵 ---------------- */
let elfEl, speechEl, speechTimer;
function buildElf() {
  elfEl = $(`<div id="elf"><img src="${ART}props/elf.png" alt=""></div>`);
  elfEl.style.left = '74%';
  elfEl.style.top = '14%';
  elfEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); elfTip(); });
  game.appendChild(elfEl);
  speechEl = $('<div id="speech"></div>');
  speechEl.style.left = '50%';
  speechEl.style.top = '29%';
  game.appendChild(speechEl);
}
function elfSay(text, voiceName, dur = 4200) {
  if (!speechEl) return;
  speechEl.textContent = text;
  speechEl.classList.add('show');
  if (voiceName) voice(voiceName);
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => speechEl.classList.remove('show'), dur);
}
function elfTip() {
  sfx.sparkle();
  elfSay(pick(sceneName === 'park' ? [
    '扔个小球，它们会飞奔着捡回来哦！',
    '轻轻点一下蝴蝶试试～',
    '说不定会遇到新朋友呢！',
  ] : [
    `多陪陪${activePet().name}，爱心就会越来越多哦～`,
    '窗外那边就是院子，可以带它们出去玩！',
    '在空白的地方拖一拖，能换个角度看小窝～',
    '爱心够了，就能再接一个小伙伴回家啦！',
  ]), pick(['elf1', 'elf2']));
}

/* ---------------- 宠物 ---------------- */
function newPet(breed, name, opts = {}) {
  const p = new Pet(stage, breed, name, { ...opts, now: simClock });
  p.speed = (isCat(breed) ? 0.28 : 0.24) * (SPD || 1);
  /* 宠物是会走动的碰撞体：撞得开玩具、绕得过家具、互相不重叠 */
  p.agent = phys.addAgent({
    o: p, r: 0.062, vu: 0, vv: 0,
    onHit: (b) => onPetKick(p, b),
  });
  p.phys = phys;                      // 移动时用它做避障
  if (!p.npc) bindPet(p);
  return p;
}

/* 宠物撞到玩具 */
function onPetKick(p, b) {
  const now = simClock;
  if (b._kickCd && now < b._kickCd) return;
  b._kickCd = now + 0.7;
  p.happy(2.2);
  p.jump(0.55);
  barkOf(p);
  if (Math.random() < 0.35) addHearts(1, p);
  if (Math.random() < 0.18) elfSay(pick(['它把球拱跑啦！', '玩得好起劲～']), 'play');
}
function barkOf(p) {
  if (p.npc) return;
  if (isCat(p.breed)) petVoice(Math.random() < 0.5 ? 'meow' : 'meow2');
  else petVoice(Math.random() < 0.5 ? 'bark' : 'bark2');
}
function trick(p) {
  p.jump(1.15);
  barkOf(p); sfx.sparkle();
  particleAt(p, '💖', 4);
}

function bindPet(p) {
  p.el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (nurseryMode) { nurseryPick(p); return; }
    if (state.active !== p.idx) setActive(p.idx);
    if (p.mode === 'sleep') return;
    p.el.setPointerCapture(e.pointerId);
    p._last = { x: e.clientX, y: e.clientY };
    p.jump(0.5); barkOf(p);
  });
  p.el.addEventListener('pointermove', (e) => {
    if (!p._last || p.mode === 'sleep') return;
    const dx = e.clientX - p._last.x, dy = e.clientY - p._last.y;
    p._last = { x: e.clientX, y: e.clientY };
    p.strokeAcc += Math.hypot(dx, dy);
    if (bathOpen && p === APet()) { if (p.strokeAcc > 40) { p.strokeAcc = 0; scrubProgress(); } return; }
    if (p.strokeAcc > 80) {
      p.strokeAcc = 0;
      if (groomMode && p === APet()) { groomProgress(e.clientX, e.clientY); return; }
      p.happy(1.8);
      particle(e.clientX, e.clientY, '💗');
      sfx.pop();
      if (isCat(p.breed) && Math.random() < 0.4) sfx.purr();
      p.petStreak++;
      if (p.petStreak >= 5) {
        p.petStreak = 0;
        trick(p); addHearts(3);
        if (Math.random() < 0.5) elfSay(isCat(p.breed) ? '它舒服得直打呼噜～' : '它开心得转圈圈啦！', 'play');
      } else {
        if (Math.random() < 0.15) barkOf(p);
        if (Math.random() < 0.1) elfSay('它喜欢你摸摸它呢～', 'stroke1');
        if (Math.random() < 0.25) addHearts(1);
      }
    }
  });
  const up = () => { p._last = null; };
  p.el.addEventListener('pointerup', up);
  p.el.addEventListener('pointercancel', up);
}

/* 自主行为 */
function autonomy(p) {
  if (nightOn || bathOpen || groomMode) return;
  const r = Math.random();

  /* 优先级最高：正在滚的球最吸引小动物 —— 谁近谁去追 */
  const rolling = phys.bodies.find(b => !b.held && !b.sleep
    && Math.hypot(b.vu, b.vv) > 0.12
    && dist({ u: b.u, v: b.v }, p) < 0.55);
  if (rolling && !p.npc) { chaseToy(p, rolling); return; }

  if (sceneName === 'park' || p.npc) {
    if (r < 0.78) p.goto(rand(0.1, 0.9), rand(0.15, 0.95), null, r < 0.3);
    else p.happy(1.6);
    return;
  }

  const buddies = pets.filter(o => o !== p && o.mode === 'idle');
  /* 找地上的玩具去拱 */
  const toy = phys.nearestBody(p.u, p.v, 0.75);
  if (toy && r < 0.46) { chaseToy(p, toy); return; }

  /* 找同伴玩：追过去 → 一起跳 */
  if (buddies.length && r < 0.66) {
    const b = pick(buddies);
    p.goto(clamp(b.u + rand(-0.09, 0.09), 0.08, 0.92),
      clamp(b.v + rand(-0.05, 0.05), 0.1, 0.95), () => {
        p.faceTo(b.u); b.faceTo(p.u);
        p.happy(2.6); b.happy(2.6);
        p.jump(0.8); later(0.18, () => b.jump(0.8));
        particleAt(p, pick(['💞', '🎵']), 2);
        if (Math.random() < 0.4) addHearts(1, p);
      }, r < 0.3);
    return;
  }

  const cushion = furniList.find(f => f.def.id === 'cushion');
  if (cushion && r < 0.76) {
    p.goto(cushion.u, cushion.v, () => {
      p.setMode('sit'); p.happy(3.4);
      later(5.2, () => { if (p.mode === 'sit') p.setMode('idle'); });
    });
  } else if (r < 0.94) p.goto(rand(0.1, 0.9), rand(0.15, 0.95));
  else p.happy(1.6);
}

/* 跑去拱玩具：走到球边 → 用鼻子顶出去（真的施加冲量） */
function chaseToy(p, b) {
  if (p._chasing) return;
  p._chasing = true;
  const aim = () => ({
    u: clamp(b.u - Math.sign(b.u - p.u) * 0.05, 0.06, 0.94),
    v: clamp(b.v - 0.03, 0.08, 0.98),
  });
  const t = aim();
  p.goto(t.u, t.v, () => {
    p._chasing = false;
    p.faceTo(b.u);
    p.happy(2.6); p.jump(0.6); barkOf(p);
    // 朝远离自己的方向顶一下
    const du = b.u - p.u, dv = (b.v - p.v) * 0.6;
    const d = Math.hypot(du, dv) || 1;
    b.kick(du / d * rand(0.5, 0.95), dv / d * rand(0.5, 0.95) / 0.6, rand(0.28, 0.5));
    particleAt(p, pick(['🎵', '✨', '💛']), 2);
    if (Math.random() < 0.5) addHearts(1);
    if (Math.random() < 0.22) elfSay(pick(['看！它玩得多开心呀！', '球被拱跑啦～']), 'play');
  }, true);
  later(6, () => { p._chasing = false; });   // 追丢了就放弃
}

/* ---------------- 家具 ---------------- */
let furniList = [];
function decorPos(f) {
  const d = state.decor[f.id];
  if (!d) return null;
  if (typeof d.u === 'number') return { u: d.u, v: d.v };
  // 旧存档兼容：v0.5 是 3D 世界坐标，v0.4 及更早是屏幕比例
  if (typeof d.z === 'number') return { u: clamp(d.x / 10.4 + 0.5, 0.08, 0.92), v: clamp(d.z / 9.5 + 0.7, 0.12, 0.95) };
  return { u: clamp(d.x, 0.08, 0.92), v: clamp((d.y - 0.5) / 0.42, 0.12, 0.95) };
}function spawnFurni(f) {
  const pos = decorPos(f) || { u: rand(0.25, 0.75), v: rand(0.35, 0.8) };
  const a = new Actor(stage, { w: f.w });
  a.el.classList.add('furni');
  a.el.style.pointerEvents = 'auto';
  a.setArt(`furni/${f.id}.png`);
  a.u = pos.u; a.v = pos.v;
  a.def = f;
  if (f.zone === 'wall') {
    a.wall = true; a.wallY = 0.30; a.u = clamp(pos.u, 0.08, 0.92);
  } else if (f.dyn) {
    /* 玩具 = 刚体：会被踢飞、会弹、会滚、会撞到别的东西 */
    a.body = phys.addBody(new Body(a, f.r, {
      hr: f.r * 0.85, rest: f.rest, fric: f.fric, spin: f.spin,
    }));
  } else {
    /* 家具 = 障碍物。soft 的（狗窝/坐垫）宠物可以走上去，不当墙用 */
    a.stat = phys.addStatic({ u: a.u, v: a.v, r: f.r, soft: !!f.soft, actor: a });
  }
  stage.add(a);
  furniList.push(a);
  bindFurni(a);
  return a;
}
function bindFurni(a) {
  let drag = null;
  a.el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    a.el.setPointerCapture(e.pointerId);
    a.el.classList.add('dragging');
    sfx.pip();
    drag = { id: e.pointerId, hist: [] };
    if (a.body) { a.body.held = true; a.body.stop(); }   // 抓在手里时不受物理支配
  });
  a.el.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (a.wall) {
      a.u = clamp(e.clientX / innerWidth, 0.06, 0.94);
      a.wallY = clamp(e.clientY / innerHeight, 0.1, 0.6);
      return;
    }
    const g = screenToGround(e.clientX, e.clientY);
    a.u = g.u; a.v = g.v;
    if (a.stat) { a.stat.u = a.u; a.stat.v = a.v; }
    if (a.body) {
      a.h = a.body.hr + 0.05;                            // 拎在半空
      drag.hist.push({ u: a.u, v: a.v, t: performance.now() });
      if (drag.hist.length > 6) drag.hist.shift();
    }
  });
  const drop = () => {
    if (!drag) return;
    const hist = drag.hist;
    drag = null;
    a.el.classList.remove('dragging');
    if (a.body) {
      a.body.held = false;
      /* 按松手前的挥动速度扔出去：甩得越快飞得越远、弹得越高 */
      if (hist.length > 1) {
        const p0 = hist[0], p1 = hist[hist.length - 1];
        const dt = Math.max(0.02, (p1.t - p0.t) / 1000);
        const vu = clamp((p1.u - p0.u) / dt, -1.6, 1.6);
        const vv = clamp((p1.v - p0.v) / dt, -1.6, 1.6);
        const sp = Math.hypot(vu, vv);
        a.body.kick(vu, vv, 0.2 + Math.min(0.5, sp * 0.4));
        if (sp > 0.3) {
          elfSay(pick(['扔得真远！它们要去追啦～', '看它们跑得多快！']), null, 2400);
          for (const p of pets) if (p.mode === 'idle') p.happy(1.5);
        }
      } else a.body.kick(0, 0, 0.1);
      sfx.pop();
      return;                                            // 玩具会自己滚，不写存档位置
    }
    sfx.pop();
    state.decor[a.def.id] = a.wall ? { u: a.u, v: a.wallY } : { u: a.u, v: a.v };
    save();
  };
  a.el.addEventListener('pointerup', drop);
  a.el.addEventListener('pointercancel', drop);
}
function wiggleFurni(id) {
  const a = furniList.find(x => x.def.id === id);
  if (!a) return;
  a.el.classList.remove('wiggle'); void a.el.offsetWidth;
  a.el.classList.add('wiggle');
  setTimeout(() => a.el.classList.remove('wiggle'), 620);
}

/* 屏幕坐标 → 地面坐标（stage.ground 的逆运算） */
function screenToGround(px, py) {
  const g = sceneName === 'park'
    ? { yNear: 0.99, yFar: 0.60, xNear: -0.02, xFar: 0.18 }
    : { yNear: 0.99, yFar: 0.74, xNear: 0.02, xFar: 0.22 };
  const yr = clamp(py / innerHeight, g.yFar, g.yNear);
  const v = clamp((yr - g.yFar) / (g.yNear - g.yFar), 0.05, 1);
  const inset = g.xFar + (g.xNear - g.xFar) * v;
  const u = clamp((px / innerWidth - inset) / (1 - inset * 2), 0.03, 0.97);
  return { u, v };
}

/* 物理撞击反馈：不同碰撞给不同声音和粒子 */
function onImpact(b, kind, force, other) {
  const a = b.o;
  if (kind === 'ground' && force > 0.28) sfx.boing();
  else if (kind === 'wall') sfx.pip();
  else if (kind === 'furni' && force > 0.22) { sfx.pop(); if (other && other.actor) wiggleActor(other.actor); }
  else if (kind === 'body' && force > 0.28) sfx.pip();
  else if (kind === 'pet') { sfx.boing(); particleAt(a, pick(['💨', '✨']), 2); }
}
function wiggleActor(a) {
  if (!a || !a.el) return;
  a.el.classList.remove('wiggle'); void a.el.offsetWidth;
  a.el.classList.add('wiggle');
  setTimeout(() => a.el.classList.remove('wiggle'), 620);
}

/* ---------------- 场景 ---------------- */
let bowlA, waterA, tubA, bowlStat = null;
function clearScene() {
  pets = []; friend = null; nurseryPets = [];
  furniList = [];
  bowlA = waterA = tubA = null; tubStat = null;
  bathOpen = false; groomMode = false;
  for (const p of pets) { p.inTub = false; p.toTub = false; }
  if (groomTimer) { cancelTimer(groomTimer); groomTimer = null; }
  clearTimers();          // 上个场景挂起的回调不能打到新场景上
  phys.reset();           // 物理世界跟着场景一起重建
  stopParkLife();
  game.querySelectorAll('#hud,#toolbar,.tray,.drawer,#elf,#speech,#bath-meter').forEach(n => n.remove());
}

function spawnPets(spots) {
  pets = state.pets.map((d, i) => {
    const p = newPet(d.breed, d.name, { idx: i, equipped: d.equipped });
    const s = spots[i] || [rand(0.3, 0.7), rand(0.4, 0.8)];
    p.u = s[0]; p.v = s[1];
    stage.add(p);
    return p;
  });
}

function buildHome(entering) {
  sceneName = 'home';
  clearScene();
  stage.setScene('home', { bg: 'bg_home.jpg' });

  bowlA = new Actor(stage, { w: 17 });
  bowlA.setArt('props/bowl_food.png');
  bowlA.u = SPOT.bowl.u; bowlA.v = SPOT.bowl.v;
  stage.add(bowlA);
  // 食盆是实心的：宠物只能围在盆边，不会站到盆里
  bowlStat = phys.addStatic({ u: SPOT.bowl.u, v: SPOT.bowl.v, r: 0.052, actor: bowlA });

  waterA = new Actor(stage, { w: 15 });
  waterA.setArt('props/bowl_water.png');
  waterA.u = SPOT.water.u; waterA.v = SPOT.water.v;
  waterA.el.style.pointerEvents = 'auto';
  waterA.el.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); sfx.bubble(); particleAt(waterA, '💧', 2);
    for (const p of pets) if (dist(waterA, p) < 0.2) { p.happy(1.6); p.think('💧', 1600); }
  });
  stage.add(waterA);
  phys.addStatic({ u: SPOT.water.u, v: SPOT.water.v, r: 0.046, actor: waterA });

  for (const f of FURNI) if (state.decor[f.id]) spawnFurni(f);

  const spots = entering === 'fromPark'
    ? state.pets.map((_, i) => [0.72 - i * 0.1, 0.35 + i * 0.06])
    : state.pets.map((_, i) => [0.36 + i * 0.14, 0.55 + (i % 2) * 0.16]);
  spawnPets(spots);

  buildElf();
  buildUI('home');
}

function buildPark() {
  sceneName = 'park';
  clearScene();
  stage.setScene('park', { bg: 'bg_park.jpg' });

  spawnPets(state.pets.map((_, i) => [0.38 + i * 0.13, 0.5 + (i % 2) * 0.14]));

  const others = Object.keys(BREEDS).filter(k => !state.pets.some(p => p.breed === k));
  const fb = pick(others.length ? others : Object.keys(BREEDS));
  friend = newPet(fb, BREEDS[fb].label, { npc: true, nametag: BREEDS[fb].label });
  friend.u = rand(0.1, 0.22); friend.v = rand(0.35, 0.55);
  friend.nextThink = 0;
  stage.add(friend);

  buildElf();
  buildUI('park');
  startParkLife();
  elfSay('哇，外面真舒服！扔个小球给它们捡吧，还有蝴蝶可以追～', 'park_go', 5500);
}

function goPark() {
  cancelGroom(true);
  if (nightOn) return;
  if (bathOpen) { finishBath(); return; }          // 洗到一半要出门，先收尾，别把人锁死
  sfx.chime(); voice('park_out');
  transition(() => buildPark());
}
function goHome() {
  sfx.pip();
  transition(() => { buildHome('fromPark'); elfSay('到家啦～玩得真开心！', 'park_home'); });
}
function transition(fn) {
  const veil = $('<div id="veil"></div>');
  game.appendChild(veil);
  requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add('on')));
  setTimeout(() => { fn(); veil.classList.remove('on'); setTimeout(() => veil.remove(), 650); }, 620);
}

/* ---------------- 拖背景 = 镜头横摇 ---------------- */
let panDrag = null;
game.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#hud,#toolbar,.tray,.drawer,#adopt,#elf')) return;
  panDrag = { x: e.clientX };
});
addEventListener('pointermove', (e) => {
  if (!panDrag) return;
  stage.nudge(e.clientX - panDrag.x);
  panDrag.x = e.clientX;
});
const endPan = () => { if (panDrag) { stage.release(); panDrag = null; } };
addEventListener('pointerup', endPan);
addEventListener('pointercancel', endPan);

/* ---------------- UI ---------------- */
let chipsEl;
function buildUI(kind) {
  const hud = $(`<div id="hud">
    <div id="heart-pill"><span class="hicon">💗</span><span class="hnum">${Math.round(state.hearts)}</span></div>
    <div id="chips"></div>
  </div>`);
  game.appendChild(hud);
  heartPill = hud.querySelector('#heart-pill');
  chipsEl = hud.querySelector('#chips');
  chipsEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const c = e.target.closest('.chip');
    if (!c) return;
    if (c.dataset.add !== undefined) { openAdoptHouse(); return; }
    setActive(+c.dataset.i);
  });
  refreshChips();

  const bar = kind === 'park'
    ? $(`<div id="toolbar">
        <button class="btn" data-act="home"><span>🏠</span><i>回家</i></button>
        <button class="btn" data-act="throw"><span>🥎</span><i>扔球</i></button>
        <button class="btn" data-act="bubble"><span>🫧</span><i>泡泡</i></button>
      </div>`)
    : $(`<div id="toolbar">
        <button class="btn" data-act="feed"><span>🍖</span><i>喂饭</i></button>
        <button class="btn" data-act="bath"><span>🛁</span><i>洗澡</i></button>
        <button class="btn" data-act="groom"><span>✨</span><i>梳毛</i></button>
        <button class="btn" data-act="sleep"><span>🌙</span><i>睡觉</i></button>
        <button class="btn" data-act="dress"><span>🎀</span><i>换装</i></button>
        <button class="btn" data-act="adopt"><span>🏡</span><i>领养</i></button>
        <button class="btn" data-act="shop"><span>🛒</span><i>商店</i></button>
        <button class="btn" data-act="park"><span>🌳</span><i>去院子</i></button>
      </div>`);
  bar.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (!b) return;
    e.stopPropagation();
    sfx.pip();
    ({
      feed: openTray, bath: openBath, groom: startGroom, sleep: toggleNight, dress: openWardrobe,
      adopt: openAdoptHouse, shop: openShop, park: goPark, home: goHome,
      throw: throwBall, bubble: blowBubbles,
    })[b.dataset.act]();
  });
  game.appendChild(bar);

  if (kind === 'home') { buildTray(); buildShop(); buildWardrobe(); buildAdoptHouse(); buildBathMeter(); }
}

function refreshChips() {
  if (!chipsEl) return;
  let html = '';
  state.pets.forEach((p, i) => {
    html += `<div class="chip${i === state.active ? ' on' : ''}" data-i="${i}">
      <img src="${ART}pets/${p.breed}_idle.png" alt=""></div>`;
  });
  if (state.pets.length < MAX_PETS && sceneName === 'home') html += `<div class="chip add" data-add>＋</div>`;
  chipsEl.innerHTML = html;
}
function setActive(i) {
  if (i === state.active) return;
  state.active = i; save();
  refreshChips();
  sfx.pip();
  const p = pets[i];
  if (p) { p.jump(0.6); p.think('💗', 1400); }
}

/* ---------------- 吃饭 ---------------- */
let trayEl;
const FOODS = [['🦴', '大骨头'], ['🍖', '肉肉'], ['🐟', '小鱼干'], ['🥛', '牛奶']];
function buildTray() {
  trayEl = $(`<div class="tray">${FOODS.map((f, i) => `<div class="food" data-i="${i}">${f[0]}</div>`).join('')}</div>`);
  trayEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const el = e.target.closest('.food');
    if (!el) return;
    trayEl.classList.remove('show');
    serveFood(FOODS[+el.dataset.i][0], e.clientX, e.clientY);
  });
  game.appendChild(trayEl);
}
function openTray() {
  cancelGroom(true); if (nightOn || bathOpen) return; trayEl.classList.toggle('show'); }
function serveFood(emoji, fx, fy) {
  const r = bowlA.el.getBoundingClientRect();
  const fly = $(`<div class="pfx" style="animation:none;font-size:7vmin">${emoji}</div>`);
  fly.style.left = fx + 'px'; fly.style.top = fy + 'px';
  fly.style.transition = 'all .55s cubic-bezier(.4,0,.6,1)';
  fxLayer.appendChild(fly);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fly.style.left = (r.left + r.width / 2) + 'px';
    fly.style.top = (r.top + r.height * 0.4) + 'px';
    fly.style.transform = 'scale(.5)';
  }));
  sfx.pop();
  later(0.6, () => {
    fly.remove();
    bowlA.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
      { duration: 380, easing: 'ease-out' });
    let done = 0;
    /* 围着盆站一圈：左右各一只、前面一只，都紧贴盆边（0.055 u ≈ 半个身位），
       之前偏移 0.10 u 又不转身，看起来像各吃各的。 */
    /* 围着食盆排座位。半径要落在盆的碰撞圈外，彼此也要拉开，
       而且必须避开旁边的家具（水碗、盆栽都可能压住某个座位）—— 
       这些都交给 phys.ringSpots 动态算，写死坐标一定会出问题。 */
    let seats = phys.ringSpots(SPOT.bowl.u, SPOT.bowl.v, 0.125, pets.length, 0.062, bowlStat);
    if (seats.length < pets.length) {
      seats = seats.concat(phys.ringSpots(SPOT.bowl.u, SPOT.bowl.v, 0.175, pets.length, 0.062, bowlStat));
    }
    const pickSeat = (p) => {
      if (!seats.length) return { u: clamp(SPOT.bowl.u + rand(-0.2, 0.2), 0.06, 0.94), v: SPOT.bowl.v };
      let bi = 0, bd = Infinity;
      seats.forEach((sp, i) => {
        const d = Math.hypot(sp.u - p.u, (sp.v - p.v) * 0.62);
        if (d < bd) { bd = d; bi = i; }
      });
      return seats.splice(bi, 1)[0];
    };
    pets.forEach((p) => {
      const seat = pickSeat(p);
      p.eating = true;                  // 从出发就免疫推挤，否则挤在盆边互相顶
      p.goto(seat.u, seat.v, () => {
        p.faceTo(SPOT.bowl.u);            // 转身面向食盆
        p._bites = 6;                     // 低头啃的动画在 pet.update 里
        p.setMode('eat');
        repeat(0.52, 6, () => {
          sfx.munch();
          particleAt(bowlA, pick(['✦', '·', '✧']), 1);
          if (--p._bites <= 0) {
            p.eating = false;
            p.setMode('idle');
            p.happy(3); p.jump(0.6); barkOf(p); p.think('😋');
            if (++done === pets.length) {
              state.stats.hunger = 100; save();
              addHearts(5 * pets.length, bowlA);
              elfSay(pets.length > 1 ? '大家都吃饱啦，肚子圆滚滚！' : '吃得真香呀～肚子圆滚滚！', 'feed_done');
            }
          }
        });
      }, true);
    });
  });
}

/* ---------------- 洗澡 ---------------- */
let bathScrub = 0, bathMeter, tubStat = null;
function buildBathMeter() {
  bathMeter = $(`<div id="bath-meter"><span class="st">✨</span><span class="st">✨</span><span class="st">✨</span></div>`);
  game.appendChild(bathMeter);
}function openBath() {
  if (nightOn || sceneName !== 'home') return;
  if (bathOpen) { finishBath(); return; }          // 再点一次 = 冲干净出来
  if (tubA) return;                                 // 正在走过去，别重复放缸
  cancelGroom(true);
  const p = APet();
  bathScrub = 0;

  tubA = new Actor(stage, { w: TUB_W });
  tubA.setArt('props/tub.png');
  tubA.u = SPOT.tub.u; tubA.v = SPOT.tub.v;
  stage.add(tubA);
  tubA.el.animate([{ opacity: 0, transform: 'translateY(3vmin)' }, { opacity: 1, transform: 'none' }],
    { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  // 浴缸是实心的：别的宠物挤不进去，球滚过来也会被弹开
  tubStat = phys.addStatic({ u: SPOT.tub.u, v: SPOT.tub.v, r: 0.10, actor: tubA });
  sfx.splash();
  elfSay(`哗啦啦～带${p.name}泡个澡，在它身上搓出好多泡泡吧！`, 'bath_start', 5200);

  // 其它宠物让开
  for (const o of pets) if (o !== p) { o.stop(); o.goto(clamp(SPOT.tub.u - 0.34, 0.06, 0.9), rand(0.7, 0.95)); }

  /* ① 先走到缸边。
     注意：要洗澡的这只必须免疫浴缸的碰撞体，否则它一边朝缸走、
     一边被自己的浴缸推开，永远走不到（目标点就在碰撞半径里）。 */
  p.toTub = true;
  p.goto(clamp(SPOT.tub.u - 0.19, 0.05, 0.95), clamp(SPOT.tub.v + 0.06, 0.1, 0.98), () => {
    p.faceTo(SPOT.tub.u);
    hopIntoTub(p);
  }, true);
}

/* ② 跳进浴缸：一条真的抛物线，落进缸里 */
function hopIntoTub(p) {
  if (!tubA) return;
  p.stop();
  p.inTub = true;                       // 这一刻起不再参与地面碰撞
  bathOpen = true;
  sfx.boing();
  const u0 = p.u, v0 = p.v;
  const tubH = tubA.artH() || innerHeight * 0.24;
  const T = 0.42;                       // 起跳到落缸的时长
  let t = 0;
  const jump = repeat(1 / 60, Math.round(T * 60) + 1, () => {
    t += 1 / 60;
    const k = Math.min(1, t / T);
    p.u = u0 + (SPOT.tub.u - u0) * k;
    p.v = v0 + (SPOT.tub.v - v0) * k;
    p.extraY = Math.sin(k * Math.PI) * tubH * 0.55 + tubH * BATH_LIFT * k;
    if (k >= 1) { cancelTimer(jump); settleInTub(p, tubH); }
  });
}

/* ③ 落定：坐在泡沫里，只露出脸和肩膀 */
function settleInTub(p, tubH) {
  if (!tubA) return;
  p.u = SPOT.tub.u; p.v = SPOT.tub.v;
  p.setMode('sit');                                  // 坐姿比站姿更像"泡"在缸里
  /* 宠物宽度按缸宽定：离线把缸和宠物合成对比出来的，
     0.48 倍缸宽 + 抬高 0.44 倍缸高，刚好露出整张脸、身体埋在泡沫里。 */
  p.setScale((TUB_W * 0.48) / (p.baseW0 * 0.92));
  p.extraY = tubH * BATH_LIFT;
  p.zOverride = 1000 + Math.round(SPOT.tub.v * 1000) - 6;   // 画在缸后面
  tubA.zOverride = 1000 + Math.round(SPOT.tub.v * 1000);
  sfx.splash();
  particleAt(tubA, '💦', 5);
  for (let i = 0; i < 6; i++) spawnBubble(p);
  bathMeter.classList.add('show');
  bathMeter.querySelectorAll('.st').forEach(s => s.classList.remove('lit'));
}

function scrubProgress() {
  bathScrub += 34;
  const p = APet();
  if (Math.random() < 0.8) spawnBubble(p);
  sfx.bubble();
  const lit = Math.min(3, Math.floor(bathScrub / 170));
  bathMeter.querySelectorAll('.st').forEach((s, i) => s.classList.toggle('lit', i < lit));
  p.happy(1.6);
  if (lit >= 3) finishBath();
}
function spawnBubble(p) {
  const r = p.el.getBoundingClientRect();
  const b = document.createElement('img');
  b.className = 'pfx';
  b.src = ART + 'props/bubble.png';
  const s = rand(3, 7);
  b.style.cssText = `left:${r.left + rand(0, r.width)}px;top:${r.top + rand(0, r.height * 0.6)}px;
    width:${s}vmin;height:auto;animation:pfly 1.5s ease-out forwards`;
  b.style.setProperty('--dx', rand(-5, 5) + 'vmin');
  b.style.setProperty('--dy', rand(-18, -10) + 'vmin');
  fxLayer.appendChild(b);
  setTimeout(() => b.remove(), 1600);
}
function finishBath() {
  if (!bathOpen) return;
  bathOpen = false;
  const p = APet();
  sfx.splash(); sfx.sparkle();
  bathMeter.classList.remove('show');
  later(0.7, () => {
    for (let i = 0; i < 12; i++) spawnBubble(p);
    /* 跳出浴缸：先恢复尺寸和层级，再走一段落地弧线 */
    p.setScale(1);
    p.setMode('idle');
    p.zOverride = null;
    p.inTub = false; p.toTub = false;
    const tubH = tubA ? (tubA.artH() || innerHeight * 0.24) : innerHeight * 0.24;
    const uFrom = p.u, uTo = clamp(SPOT.tub.u - 0.16, 0.06, 0.94);
    let t = 0;
    sfx.boing();
    const out = repeat(1 / 60, 26, () => {
      t += 1 / 60;
      const k = Math.min(1, t / 0.4);
      p.u = uFrom + (uTo - uFrom) * k;
      p.extraY = (1 - k) * tubH * BATH_LIFT + Math.sin(k * Math.PI) * tubH * 0.4;
      if (k >= 1) { cancelTimer(out); p.extraY = 0; p.jump(0.5); }
    });
    if (tubA) {
      const t = tubA; tubA = null;
      t.el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(2vmin)' }], { duration: 400 })
        .onfinish = () => stage.remove(t);
    }
    state.stats.clean = 100; save();
    p.happy(3.2); barkOf(p); p.think('✨');
    addHearts(8, p);
    elfSay('哇，香喷喷亮晶晶！', 'bath_done');
    later(0.7, () => p.goto(rand(0.35, 0.65), rand(0.6, 0.9)));
  });
}

/* ---------------- 梳毛 ---------------- */
let groomCount = 0, groomTimer = null;
function startGroom() {
  if (nightOn || bathOpen || sceneName !== 'home') return;
  if (groomMode) { cancelGroom(); return; }        // 再点一次 = 收工
  groomMode = true; groomCount = 0;
  const p = APet();
  p.stop(); p.setMode('sit');
  elfSay(`在${activePet().name}身上轻轻划一划，给它做个美容～`, 'brush_start', 5000);
  /* 不加超时的话，孩子点了梳毛又跑去干别的，groomMode 会一直是 true，
     之后洗澡、去院子全被挡住 —— 这是"院子去不了"的元凶之一。 */
  if (groomTimer) cancelTimer(groomTimer);
  groomTimer = later(20, () => { if (groomMode) cancelGroom(true); });
}
function cancelGroom(quiet) {
  if (!groomMode) return;
  groomMode = false;
  if (groomTimer) cancelTimer(groomTimer); groomTimer = null;
  const p = APet();
  if (p && p.mode === 'sit') p.setMode('idle');
  if (!quiet) sfx.pip();
}
function groomProgress(x, y) {
  groomCount++;
  sfx.brush();
  particle(x, y, pick(['✨', '🫧']));
  APet().happy(1.6);
  if (groomCount >= 10) {
    cancelGroom(true);
    sfx.sparkle();
    const p = APet();
    p.setMode('idle'); p.jump(0.8); barkOf(p);
    addHearts(5, p);
    elfSay('毛毛梳得顺顺的，真漂亮！', 'brush_done');
  }
}

/* ---------------- 睡觉 ---------------- */
let nightTimer;
function toggleNight() {
  cancelGroom(true);
  if (bathOpen || sceneName !== 'home') return;
  if (!nightOn) {
    nightOn = true;
    game.classList.add('is-night');
    trayEl.classList.remove('show');
    closeDrawers();
    const bed = furniList.find(f => f.def.id === 'bed');
    // 围着狗窝找能躺的位置（同样要避开别的家具）
    const bedU = bed ? bed.u : 0.5, bedV = bed ? bed.v : 0.7;
    let spots = phys.ringSpots(bedU, bedV, bed ? 0.10 : 0.14, pets.length, 0.062, bed && bed.stat);
    pets.forEach((p, i) => {
      const sp = spots[i] || { u: clamp(bedU + (i - (pets.length - 1) / 2) * 0.17, 0.08, 0.92), v: bedV };
      /* 睡觉是过场性质的，就位途中直接免疫一切碰撞：
         否则几只宠物挤在窝边互相推、又被旁边家具挡，永远躺不下。 */
      p.settling = true;
      if (p.agent) p.agent.ghost = true;
      p.goto(sp.u, sp.v, () => {
        p.settling = false;
        if (p.agent) p.agent.ghost = false;
        p.setMode('sleep');
      });
    });
    sfx.night();
    elfSay('嘘——宝贝们要睡觉啦，晚安～', 'sleep', 5000);
    nightTimer = later(9, morning);
  } else { if (nightTimer) cancelTimer(nightTimer); morning(); }
}
function morning() {
  if (!nightOn) return;
  nightOn = false;
  game.classList.remove('is-night');
  pets.forEach(p => {
    p.settling = false;
    if (p.agent) p.agent.ghost = false;
    p.setMode('idle'); p.jump(0.7); p.happy(3);
  });
  barkOf(APet());
  state.stats.energy = 100; save();
  sfx.chime();
  addHearts(3 * pets.length, APet());
  elfSay('早上好呀！睡饱饱，精神好！', 'wake');
}

/* ---------------- 商店 ---------------- */
function buildShop() {
  const shop = $(`<div id="shop" class="drawer"><h3>温暖小家具 <button class="btn dclose">✕</button></h3><div class="dlist"></div></div>`);
  const list = shop.querySelector('.dlist');
  for (const f of FURNI) {
    const item = $(`<div class="shop-item" data-id="${f.id}">
      <div class="thumb"><img src="${ART}furni/${f.id}.png" alt=""></div>
      <div class="info"><div class="name">${f.name}</div><div class="price">💗 ${f.price}</div></div>
    </div>`);
    item.addEventListener('pointerdown', (e) => { e.stopPropagation(); buyFurni(f); });
    list.appendChild(item);
  }
  shop.querySelector('.dclose').addEventListener('pointerdown', (e) => { e.stopPropagation(); shop.classList.remove('show'); sfx.pip(); });
  game.appendChild(shop);
  refreshShop();
}
function refreshShop() {
  document.querySelectorAll('#shop .shop-item').forEach(el => {
    const f = FURNI.find(x => x.id === el.dataset.id);
    const owned = !!state.decor[f.id];
    el.classList.toggle('owned', owned);
    el.querySelector('.price').innerHTML = owned ? '已经搬回家啦 ✓' : `💗 ${f.price}`;
  });
}
function closeDrawers(except) {
  ['shop', 'wardrobe', 'adopt-house'].forEach(id => {
    if (id !== except) document.getElementById(id)?.classList.remove('show');
  });
}
function openShop() {
  cancelGroom(true);
  if (nightOn || bathOpen) return;
  closeDrawers('shop');
  document.getElementById('shop').classList.add('show');
  elfSay('用小爱心换温暖的小家具吧！', 'shop_open');
}
function buyFurni(f) {
  if (state.decor[f.id]) { wiggleFurni(f.id); sfx.pip(); return; }
  if (state.hearts < f.price) return notEnough();
  state.hearts -= f.price;
  heartPill.querySelector('.hnum').textContent = Math.round(state.hearts);
  state.decor[f.id] = f.zone === 'wall' ? { u: 0.14, v: 0.3 } : { u: rand(0.3, 0.7), v: rand(0.4, 0.85) };
  save();
  const a = spawnFurni(f);
  refreshShop();
  sfx.ding(); sfx.sparkle();
  document.getElementById('shop').classList.remove('show');
  particleAt(a, '✨', 4);
  elfSay('放这里真不错！按住它还能挪位置哦～', 'placed', 5000);
  if (f.use === 'play') setTimeout(() => APet() && autonomy(APet()), 1200);
}
function notEnough() {
  sfx.pip();
  elfSay('爱心还差一点点，多陪陪它们就有啦！', 'no_hearts');
  heartPill.classList.remove('pulse'); void heartPill.offsetWidth;
  heartPill.classList.add('pulse');
}

/* ---------------- 换装 ---------------- */
function buildWardrobe() {
  const wd = $(`<div id="wardrobe" class="drawer"><h3><span class="wd-who"></span>的衣柜 <button class="btn dclose">✕</button></h3><div class="dlist"></div></div>`);
  const list = wd.querySelector('.dlist');
  for (const c of CLOTHES) {
    const item = $(`<div class="shop-item wd-item" data-id="${c.id}">
      <div class="thumb"><img src="${ART}clothes/${c.id}.png" alt=""></div>
      <div class="info"><div class="name">${c.name}</div><div class="price"></div></div>
    </div>`);
    item.addEventListener('pointerdown', (e) => { e.stopPropagation(); tapCloth(c); });
    list.appendChild(item);
  }
  wd.querySelector('.dclose').addEventListener('pointerdown', (e) => { e.stopPropagation(); wd.classList.remove('show'); sfx.pip(); });
  game.appendChild(wd);
  refreshWardrobe();
}
function refreshWardrobe() {
  const who = document.querySelector('#wardrobe .wd-who');
  if (who) who.textContent = activePet().name;
  const eq = activePet().equipped;
  document.querySelectorAll('#wardrobe .wd-item').forEach(el => {
    const c = CLOTHES.find(x => x.id === el.dataset.id);
    const owned = state.wardrobe.owned[c.id];
    const worn = eq.includes(c.id);
    el.classList.toggle('owned', owned);
    el.classList.toggle('worn', worn);
    el.querySelector('.price').innerHTML = worn ? '穿着呢 💕' : owned ? '点一下穿上' : `💗 ${c.price}`;
  });
}
function tapCloth(c) {
  const d = activePet();
  if (!state.wardrobe.owned[c.id]) {
    if (state.hearts < c.price) return notEnough();
    state.hearts -= c.price;
    heartPill.querySelector('.hnum').textContent = Math.round(state.hearts);
    state.wardrobe.owned[c.id] = true;
    sfx.ding();
  }
  const i = d.equipped.indexOf(c.id);
  if (i >= 0) { d.equipped.splice(i, 1); sfx.pip(); }
  else {
    d.equipped = d.equipped.filter(id => (CLOTHES.find(x => x.id === id) || {}).slot !== c.slot);
    d.equipped.push(c.id);
    sfx.sparkle();
    trick(APet());
    elfSay(`哇，${d.name}穿上${c.name}真好看！`, 'dress_on');
  }
  save();
  APet().setEquipped(d.equipped);
  refreshWardrobe();
}
function openWardrobe() {
  cancelGroom(true);
  if (nightOn || bathOpen) return;
  closeDrawers('wardrobe');
  refreshWardrobe();
  document.getElementById('wardrobe').classList.add('show');
  elfSay('给它挑一件漂亮衣服吧！', 'dress_open');
}

/* ---------------- 领养屋 ---------------- */
function buildAdoptHouse() {
  const ah = $(`<div id="adopt-house" class="drawer"><h3>领养小屋 <button class="btn dclose">✕</button></h3><div class="dlist"></div></div>`);
  ah.querySelector('.dclose').addEventListener('pointerdown', (e) => { e.stopPropagation(); ah.classList.remove('show'); sfx.pip(); });
  game.appendChild(ah);
}
function refreshAdoptHouse() {
  const list = document.querySelector('#adopt-house .dlist');
  if (!list) return;
  const price = ADOPT_PRICE[state.pets.length] ?? 999;
  list.innerHTML = '';
  if (state.pets.length >= MAX_PETS) {
    list.appendChild($(`<div class="ah-note">小窝住满啦～<br>四个小家伙已经很热闹咯！</div>`));
    return;
  }
  list.appendChild($(`<div class="ah-note">再接一个小伙伴回家<br>需要 💗 ${price}</div>`));
  for (const key of Object.keys(BREEDS)) {
    const b = BREEDS[key];
    const item = $(`<div class="shop-item ah-item">
      <div class="thumb"><img src="${ART}pets/${key}_idle.png" alt=""></div>
      <div class="info"><div class="name">${b.label}</div>
      <div class="price">${b.kind === 'cat' ? '🐱 小猫' : '🐶 小狗'} · 💗 ${price}</div></div>
    </div>`);
    item.addEventListener('pointerdown', (e) => { e.stopPropagation(); adoptNew(key, price); });
    list.appendChild(item);
  }
}
function openAdoptHouse() {
  cancelGroom(true);
  if (nightOn || bathOpen || sceneName !== 'home') return;
  closeDrawers('adopt-house');
  refreshAdoptHouse();
  document.getElementById('adopt-house').classList.add('show');
  elfSay('这些小家伙都想有个家，挑一个吧！', 'adopt_open');
}
const NEW_NAMES = ['奶糖', '汤圆', '花卷', '芝麻', '桃子', '团子', '棉花', '柚子'];
function adoptNew(breed, price) {
  if (state.pets.length >= MAX_PETS) return;
  if (state.hearts < price) return notEnough();
  state.hearts -= price;
  heartPill.querySelector('.hnum').textContent = Math.round(state.hearts);
  const used = state.pets.map(p => p.name);
  const name = NEW_NAMES.find(n => !used.includes(n)) || '小可爱';
  state.pets.push({ breed, name, equipped: [] });
  state.active = state.pets.length - 1;
  save();

  const p = newPet(breed, name, { idx: state.pets.length - 1 });
  p.u = 0.92; p.v = 0.28;
  stage.add(p);
  pets.push(p);
  p.goto(rand(0.4, 0.62), rand(0.55, 0.8), () => { trick(p); p.happy(3); }, true);

  refreshChips();
  refreshAdoptHouse();
  document.getElementById('adopt-house').classList.remove('show');
  sfx.ding(); sfx.sparkle();
  voice('adopt_new');
  elfSay(`欢迎${name}回家！现在有 ${state.pets.length} 个小伙伴啦～`, null, 5200);
}

/* ---------------- 公园玩法 ---------------- */
let parkTimers = [], ballBusy = false, friendCd = 0;
let butterflies = [], parkBubbles = [];
function startParkLife() {
  for (let i = 0; i < 3; i++) {
    const b = new Actor(stage, { w: 8 });
    b.setArt('props/butterfly.png');
    b.el.style.pointerEvents = 'auto';
    b.u = rand(0.2, 0.8); b.v = rand(0.15, 0.5);
    b.home = { u: b.u, v: b.v };
    b.t = rand(0, 9); b.flee = 0;
    b.el.addEventListener('pointerdown', (e) => { e.stopPropagation(); chaseButterfly(b); });
    stage.add(b);
    butterflies.push(b);
  }
  parkTimers.push(setInterval(() => {
    if (!friend || sceneName !== 'park') return;
    for (const p of pets) {
      if (Math.hypot(p.u - friend.u, p.v - friend.v) < 0.14 && Date.now() > friendCd) {
        friendCd = Date.now() + 12000;
        trick(p); friend.jump(1); friend.happy(3);
        addHearts(4, p);
        elfSay(`${p.name}交到新朋友啦！`, 'park_friend');
        sfx.sparkle();
        return;
      }
    }
  }, 800));
}
function stopParkLife() {
  parkTimers.forEach(clearInterval);
  parkTimers = []; ballBusy = false;
  butterflies = []; parkBubbles = [];
}
function chaseButterfly(b) {
  sfx.sparkle();
  particleAt(b, '✨', 3);
  b.flee = 1.4;
  const c = APet();
  c.goto(clamp(b.u, 0.08, 0.92), clamp(b.v + 0.3, 0.15, 0.95), () => {
    trick(c);
    addHearts(2, c);
    if (Math.random() < 0.5) elfSay('追到蝴蝶啦，好厉害！', 'park_butterfly');
  }, true);
}function throwBall() {
  if (ballBusy || !pets.length || sceneName !== 'park') return;
  ballBusy = true;
  sfx.pop(); voice('park_ball');

  /* 走真物理：抛出去后自己弹、自己滚、撞到东西会反弹 */
  const ball = new Actor(stage, { w: 8 });
  ball.setArt('furni/ball.png');
  ball.u = 0.5; ball.v = 0.98;
  stage.add(ball);
  const body = phys.addBody(new Body(ball, 0.03, { hr: 0.026, rest: 0.66, fric: 1.0, spin: 1 }));
  const tu = rand(0.15, 0.85), tv = rand(0.25, 0.6);
  body.kick((tu - ball.u) * 1.35, (tv - ball.v) * 1.35, 0.72);

  // 全家一起去追，谁先到谁叼回来
  for (const p of pets) p.stop();
  let fetched = false;
  const watch = repeat(0.25, 40, () => {
    if (fetched) return;
    // 球停下来之前，宠物一直朝它跑
    for (const p of pets) {
      if (p.mode === 'sleep') continue;
      if (dist({ u: body.u, v: body.v }, p) < 0.075) {
        fetched = true;
        cancelTimer(watch);
        phys.removeBody(body);
        stage.remove(ball);
        p.think('🥎'); sfx.pip(); barkOf(p);
        p.goto(rand(0.4, 0.6), rand(0.8, 0.95), () => {
          trick(p);
          addHearts(3, p);
          elfSay(pick(['捡回来啦！再扔一次？', `${p.name}跑得好快呀！`]), 'park_fetch');
          ballBusy = false;
        }, true);
        return;
      }
      if (p.tu === null || p._ballAim === undefined || Math.abs(p._ballAim - body.u) > 0.06) {
        p._ballAim = body.u;
        p.goto(clamp(body.u, 0.06, 0.94), clamp(body.v + 0.02, 0.1, 0.98), null, true);
      }
    }
  });
  // 兜底：万一谁都没捡到，10 秒后收工
  later(10, () => {
    if (fetched) return;
    cancelTimer(watch);
    phys.removeBody(body); stage.remove(ball);
    ballBusy = false;
  });
}
function blowBubbles() {
  sfx.bubble();
  for (let i = 0; i < 7; i++) {
    const b = new Actor(stage, { w: rand(5, 9) });
    b.setArt('props/bubble.png');
    b.el.style.pointerEvents = 'auto';
    b.u = rand(0.2, 0.8); b.v = rand(0.55, 0.95);
    b.rise = rand(20, 42);
    b.el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sfx.bubble(); particleAt(b, '💧', 2);
      stage.remove(b); parkBubbles = parkBubbles.filter(x => x !== b);
      if (Math.random() < 0.4) addHearts(1);
    });
    stage.add(b);
    parkBubbles.push(b);
    setTimeout(() => {
      if (b.el.parentNode) { stage.remove(b); parkBubbles = parkBubbles.filter(x => x !== b); }
    }, 7000);
  }
  pets.forEach(p => { if (p.mode === 'idle') p.happy(2.5); });
}

/* ---------------- 伙伴互动 / 状态衰减 ---------------- */
setInterval(() => {
  if (sceneName !== 'home' || nightOn || bathOpen || pets.length < 2) return;
  const now = Date.now();
  for (let i = 0; i < pets.length; i++) for (let j = i + 1; j < pets.length; j++) {
    const a = pets[i], b = pets[j];
    if (a.mode !== 'idle' || b.mode !== 'idle') continue;
    if (now < a.buddyCd || now < b.buddyCd) continue;
    if (Math.hypot(a.u - b.u, a.v - b.v) < 0.16) {
      a.buddyCd = b.buddyCd = now + 15000;
      a.faceTo(b.u); b.faceTo(a.u);
      trick(a); b.happy(2.6); b.jump(0.7);
      addHearts(2, a);
      if (Math.random() < 0.45) elfSay(`${a.name}和${b.name}玩到一起啦！`, 'buddies');
      return;
    }
  }
}, 1500);

setInterval(() => {
  if (!pets.length || nightOn) return;
  state.stats.hunger = Math.max(0, state.stats.hunger - 0.5);
  state.stats.clean = Math.max(0, state.stats.clean - 0.35);
  save();
  if (sceneName !== 'home') return;
  if (state.stats.hunger < 42 && Math.random() < 0.5) {
    pick(pets).think('🍖');
    if (Math.random() < 0.4) elfSay('咕噜咕噜～小肚子在叫啦，我们喂点好吃的吧！', 'hungry');
  } else if (state.stats.clean < 40 && Math.random() < 0.4) {
    pick(pets).think('🛁');
    if (Math.random() < 0.4) elfSay('身上有点脏脏啦，洗个泡泡澡吧！', 'dirty');
  }
}, 12000);

/* ---------------- 主循环 ---------------- */
/* 由主循环驱动的延时/重复，替代 setTimeout/setInterval：
   ① 后台被节流时不会把玩法流程卡在半路
   ② 自检可以手动步进验证 */
let timers = [];
function later(sec, fn) { const t = { at: simClock + sec, fn }; timers.push(t); return t; }
function repeat(sec, times, fn) {
  const t = { at: simClock + sec, every: sec, left: times, fn };
  timers.push(t); return t;
}
function cancelTimer(t) { timers = timers.filter(x => x !== t); }
function clearTimers() { timers = []; }
function runTimers() {
  if (!timers.length) return;
  const due = timers.filter(t => simClock >= t.at);
  for (const t of due) {
    if (t.every) {
      t.left--; t.at = simClock + t.every;
      if (t.left <= 0) timers = timers.filter(x => x !== t);
      try { t.fn(); } catch (e) { console.error('timer', e); }
    } else {
      timers = timers.filter(x => x !== t);
      try { t.fn(); } catch (e) { console.error('timer', e); }
    }
  }
}

/* 一帧的全部推进逻辑。抽出来是为了能被调试器手动步进 ——
   无头浏览器里 rAF 几乎不触发，行为逻辑没法靠截图验证。 */
function step(dt, time) {
  runTimers();
  for (const p of pets) {
    p.update(dt, time);
    if (p.agent) {
      p.agent.vu = p.vu || 0; p.agent.vv = p.vv || 0;
      p.agent.ghost = !!p.inTub || !!p.toTub || !!p.settling;
      p.agent.noPush = p.mode === 'sleep' || p.eating || p.settling || !!p.inTub;
    }
    if (p.tu === null && p.mode === 'idle' && time > p.nextThink && !nightOn && !bathOpen && !groomMode) {
      p.nextThink = time + rand(3.5, 8);
      autonomy(p);
    }
  }
  if (friend) {
    friend.update(dt, time);
    if (friend.agent) { friend.agent.vu = friend.vu || 0; friend.agent.vv = friend.vv || 0; }
    if (friend.tu === null && time > friend.nextThink) { friend.nextThink = time + rand(3, 7); autonomy(friend); }
  }
  for (const p of nurseryPets) p.update(dt, time);
  phys.step(dt);   // 玩具的重力/弹跳/滚动、宠物绕开家具、宠物之间互不重叠

  for (let i = 0; i < butterflies.length; i++) {
    const b = butterflies[i];
    b.t += dt;
    if (b.flee > 0) b.flee -= dt;
    const rr = b.flee > 0 ? 0.22 : 0.11;
    b.u = clamp(b.home.u + Math.sin(b.t * 0.8 + i * 2) * rr, 0.06, 0.94);
    b.v = clamp(b.home.v + Math.cos(b.t * 0.6 + i) * rr * 0.5, 0.1, 0.6);
    b.bob = Math.sin(b.t * 3.2 + i) * 12;
    b.tilt = Math.sin(b.t * 2 + i) * 10;
  }
  for (const b of parkBubbles) {
    b.bob += b.rise * dt;
    b.u += Math.sin(time + b.rise) * 0.0006;
  }
  stage.update(dt);
}

/* 全局只用这一个累加时钟。以前主循环用 rAF 的绝对时间戳、
   宠物内部又用 performance.now()，三个时钟对不上，
   导致定时器乱跳、宠物一直卡在"开心"姿态。 */
let lastT = 0, simClock = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const time = t / 1000;
  const dt = Math.min(0.05, time - lastT) || 0.016;
  lastT = time;
  simClock += dt;
  try { step(dt, simClock); } catch (e) { console.error('loop', e); }
}

/* ---------------- 首次领养 ---------------- */
let nurseryMode = false, nurseryChosen = null, nurseryEl = null;
function buildAdoptScreen() {
  nurseryMode = true;
  sceneName = 'home';
  clearScene();
  stage.setScene('home', { bg: 'bg_adopt.jpg' });

  Object.keys(BREEDS).forEach((k, i) => {
    const col = i % 4, row = (i / 4) | 0;
    const p = newPet(k, BREEDS[k].label, { idx: i, w: 20 });
    p.breedKey = k;
    p.u = 0.15 + col * 0.235;
    p.v = row === 0 ? 0.32 : 0.72;
    stage.add(p);
    nurseryPets.push(p);
    setInterval(() => { if (nurseryMode && Math.random() < 0.35) p.happy(1.4); }, 2600 + i * 320);
  });

  const names = ['布丁', '豆豆', '可乐', '糯米', '雪球', '毛毛'];
  nurseryEl = $(`<div id="adopt">
    <h1>🐾 欢迎来到宠物小窝</h1>
    <div class="sub">小猫小狗都想跟你回家，点一点它们，先选一只吧！</div>
    <div id="name-panel"><h2 class="pickname">给它取个好听的名字吧</h2><div id="name-grid">
      ${names.map(n => `<button class="btn">${n}</button>`).join('')}
    </div></div>
  </div>`);
  nurseryEl.querySelector('#name-grid').addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || !nurseryChosen) return;
    e.stopPropagation();
    sfx.ding(); sfx.sparkle(); voice('adopt_done');
    state.pets = [{ breed: nurseryChosen, name: btn.textContent, equipped: [] }];
    state.active = 0;
    save();
    nurseryEl.classList.add('gone');
    setTimeout(() => {
      nurseryEl.remove();
      nurseryMode = false;
      buildHome();
      setTimeout(() => elfSay(`这就是你们温暖的小家～摸摸${activePet().name}，它会很开心哦！`, 'home_first', 6000), 800);
    }, 650);
  });
  game.appendChild(nurseryEl);
  buildElf();
  setTimeout(() => voice('welcome'), 600);
}
function nurseryPick(p) {
  sfx.unlock(); sfx.pop();
  petVoice(isCat(p.breedKey) ? 'meow' : 'bark');
  nurseryChosen = p.breedKey;
  nurseryPets.forEach(o => { o.baseW = o === p ? 25 : 17; if (o === p) { o.jump(1); o.happy(4); } });
  nurseryEl.querySelector('.pickname').textContent = `给这只${BREEDS[p.breedKey].label}取个好听的名字吧`;
  setTimeout(() => {
    if (nurseryChosen === p.breedKey) nurseryEl.querySelector('#name-panel').classList.add('show');
  }, 700);
}

/* ---------------- 启动 ---------------- */
/* 角落显示版本号：改完代码你能一眼确认自己看的是不是新版 */
{
  const v = document.getElementById('ver');
  if (v) v.textContent = VERSION;
}
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
const hasSave = load();
if (hasSave) buildHome(); else buildAdoptScreen();
requestAnimationFrame(loop);

requestAnimationFrame(() => {
  const b = document.getElementById('boot');
  if (b) { b.classList.add('gone'); setTimeout(() => b.remove(), 700); }
});
if (hasSave) setTimeout(() => {
  elfSay(`欢迎回来！${activePet().name}好想你呀～`, null, 4000);
  const p = APet(); if (p) { p.jump(1); barkOf(p); }
}, 900);

/* ---- 调试钩子（正常游玩不带这些参数）----
   ?click=park   模拟点一下工具栏按钮，用来验证按钮链路
   ?walk=1       让宠物一直来回走，方便截运动中的帧
   ?probe=1      把关键状态写进 title，配合 --dump-dom 读 */
const QS = new URLSearchParams(location.search);
if (QS.get('walk') === '1') setInterval(() => {
  for (const p of pets) if (p.tu === null) p.goto(rand(0.15, 0.85), rand(0.2, 0.9), null, false);
}, 1200);
if (QS.get('click')) setTimeout(() => {
  const b = document.querySelector(`#toolbar .btn[data-act="${QS.get('click')}"]`);
  if (!b) { document.title = 'PROBE no-button'; return; }
  b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
}, 1600);
if (QS.get('probe')) setInterval(() => {
  const a = APet();
  document.title = `PROBE scene=${sceneName} pets=${pets.length} friend=${!!friend} `
    + `night=${nightOn} bath=${bathOpen} groom=${groomMode} tub=${!!tubA} `
    + `p0=${a ? `${a.mode}/${a.u.toFixed(2)},${a.v.toFixed(2)}` + (a.tu !== null ? `→${a.tu.toFixed(2)},${a.tv.toFixed(2)}` : '') : '-'} `
    + `inTub=${a && !!a.inTub} w=${a ? a.w.toFixed(1) : '-'} base0=${a ? a.baseW0 : '-'} extraY=${a ? Math.round(a.extraY) : '-'} `
    + `others=${pets.map(x => x.w.toFixed(0) + '@' + x.v.toFixed(2)).join(',')} `
    + `bg=${(stage.bgEl.getAttribute('src') || '').split('/').pop()} err=${window.__err || '-'}`;
}, 700);


/* ?steps=N 手动推进 N 帧（每帧 1/30 秒），不依赖 rAF */
if (QS.get('steps')) setTimeout(() => {
  const n = +QS.get('steps');
  for (let i = 0; i < n; i++) { simClock += 1 / 30; try { step(1 / 30, simClock); } catch (e) { window.__err = e.message; } }
}, 2600);

const dbg = new URLSearchParams(location.search).get('auto');
if (dbg && hasSave) setTimeout(() => ({
  night: toggleNight, bath: openBath, shop: openShop, feed: openTray,
  park: goPark, dress: openWardrobe, adopt: openAdoptHouse,
})[dbg]?.(), 1500);
/* 自检用出口（selftest.html 驱动） */
window.__game = {
  phys,
  get pets() { return pets; },
  get friend() { return friend; },
  get furni() { return furniList; },
  get scene() { return sceneName; },
  get flags() { return { night: nightOn, bath: bathOpen, groom: groomMode, tub: !!tubA }; },
  state, stage, step,
  goPark, goHome, toggleNight, openBath, startGroom, openTray, serveFood,
  openShop, buyFurni, openWardrobe, tapCloth, openAdoptHouse, adoptNew,
  throwBall, blowBubbles, setActive, scrubProgress, finishBath,
  run(n = 120, dt = 1 / 30) { for (let i = 0; i < n; i++) { simClock += dt; step(dt, simClock); } },
};
