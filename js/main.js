/* ============ Ada的宠物小窝 · 主逻辑 v0.5.0（真 3D / 可交互 / 可碰撞）============ */
import * as ENG from './engine.js';
import { THREE, scene, camera, onTick, groundAt, pickAt, toScreen } from './engine.js';
import { BREEDS, FURNI, CLOTHES, isCat } from './data.js';
import { Pet3D } from './pet3d.js';
import {
  buildRoom, buildPark, buildFurni, buildBowl, buildTub, buildButterfly,
  HOME_BOUNDS, PARK_BOUNDS,
} from './props3d.js';
import { PhysWorld, Body } from './physics.js';
import { solid, glossy } from './mat.js';
import { sfx, voice, petVoice } from './audio.js';
import { state, load, save, activePet } from './save.js';

const game = document.getElementById('game');
const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const MAX_PETS = 4;
const ADOPT_PRICE = [0, 40, 70, 110];

/* 世界固定点位 */
const BOWL = { x: -2.9, z: 0.2 };
const WATER = { x: -3.0, z: 1.5 };

let sceneName = 'home';
let bounds = HOME_BOUNDS;
let phys = new PhysWorld(HOME_BOUNDS);
let worldRoot = new THREE.Group();
scene.add(worldRoot);

let pets = [], friend = null, nurseryPets = [];
let nightOn = false, bathOpen = false, groomMode = false;
const APet = () => pets[state.active] || pets[0];

/* ---------------- DOM 特效层（世界坐标 → 屏幕）---------------- */
const fxLayer = $('<div id="fx"></div>');
game.appendChild(fxLayer);
const _sp = {};
function particle3(v3, emoji, n = 1) {
  const p = toScreen(v3, _sp);
  particle(p.x, p.y, emoji, n);
}
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
const _dayPane = new THREE.Color(), _nightPane = new THREE.Color();
const _hv = new THREE.Vector3();
function headPos(pet) {
  return _hv.set(pet.root.position.x, pet.body.position.y + pet.headR * 1.6, pet.root.position.z);
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
  if (at) particle3(at, '💗', Math.min(n, 5));
}

/* ---------------- 小精灵（3D 飞舞）---------------- */
let elf = null, speechEl, speechTimer;
function buildElf() {
  const g = new THREE.Group();
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.28 }));
  g.add(glow);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10),
    new THREE.MeshStandardMaterial({ color: '#ffe9b0', roughness: 0.35, emissive: 0xffc46a, emissiveIntensity: 0.7 }));
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10),
    new THREE.MeshStandardMaterial({ color: '#fff3d8', roughness: 0.4, emissive: 0xffd9a0, emissiveIntensity: 0.5 }));
  head.position.y = 0.2;
  g.add(head);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7),
      new THREE.MeshStandardMaterial({
        color: '#cfeaff', transparent: true, opacity: 0.55, roughness: 0.2,
        side: THREE.DoubleSide, emissive: 0x8fd0ee, emissiveIntensity: 0.4,
      }));
    w.scale.set(0.05, 0.26, 0.16);
    w.position.set(s * 0.14, 0.06, -0.06);
    w.rotation.z = s * 0.5;
    g.add(w);
    (g.userData.wings = g.userData.wings || []).push({ w, s });
  }
  const light = new THREE.PointLight(0xffd9a0, 1.4, 4, 2);
  g.add(light);
  g.userData.pick = { type: 'elf' };
  return g;
}
function elfSay(text, voiceName, dur = 4200) {
  if (!speechEl) return;
  speechEl.textContent = text;
  speechEl.classList.add('show');
  if (voiceName) voice(voiceName);
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => speechEl.classList.remove('show'), dur);
}
function placeSpeech() {
  if (!elf || !speechEl || !speechEl.classList.contains('show')) return;
  const p = toScreen(elf.position, _sp);
  speechEl.style.left = clamp(p.x, innerWidth * 0.24, innerWidth * 0.76) + 'px';
  speechEl.style.top = Math.max(p.y + 42, 90) + 'px';
}

/* ---------------- 宠物行为 ---------------- */
function newPet(breed, name, opts = {}) {
  const p = new Pet3D(breed, name, opts);
  p.tx = null; p.tz = null; p.onArrive = null;
  p.moveSpeed = (isCat(breed) ? 2.05 : 1.85) * (opts.fast ? 1.5 : 1);
  p.nextThink = performance.now() / 1000 + rand(2, 5);
  p.agent = { pos: p.root.position, r: 0.62, vx: 0, vz: 0, onBump: (b) => onPetBump(p, b) };
  p.buddyCd = 0;
  p.strokeAcc = 0; p.petStreak = 0;
  return p;
}
function goTo(p, x, z, then, run = false) {
  p.tx = clamp(x, bounds.x0, bounds.x1);
  p.tz = clamp(z, bounds.z0, bounds.z1);
  p.onArrive = then || null;
  p.running = run;
  p.setMode('walk');
}
function stopPet(p) {
  p.tx = p.tz = null; p.onArrive = null;
  if (p.mode === 'walk') p.setMode('idle');
}
function onPetBump(p, body) {
  if (body._cd && performance.now() < body._cd) return;
  body._cd = performance.now() + 900;
  sfx.boing();
  p.happy(2);
  p.jump(0.6);
  if (Math.random() < 0.5) barkOf(p);
  if (Math.random() < 0.3) addHearts(1, headPos(p));
}
function barkOf(p) {
  if (p.npc) return;
  if (p.cat) petVoice(Math.random() < 0.5 ? 'meow' : 'meow2');
  else petVoice(Math.random() < 0.5 ? 'bark' : 'bark2');
}
function trick(p) {
  if (Math.random() < 0.5) p.jump(1.15); else p.roll();
  barkOf(p); sfx.sparkle();
  particle3(headPos(p), '💖', 4);
}

/* 自主行为 */
function autonomy(p) {
  if (nightOn || bathOpen || groomMode) return;
  const r = Math.random();
  if (sceneName === 'park' || p.npc) {
    if (r < 0.78) goTo(p, rand(bounds.x0 + 0.6, bounds.x1 - 0.6), rand(bounds.z0 + 0.6, bounds.z1 - 0.4), null, r < 0.3);
    else p.happy(1.6);
    return;
  }
  const toys = furniList.filter(f => f.def.use === 'play');
  const buddies = pets.filter(o => o !== p && o.mode === 'idle');
  if (buddies.length && r < 0.26) {
    const b = pick(buddies);
    goTo(p, b.root.position.x + rand(-1, 1), b.root.position.z + rand(0.7, 1.2));
    return;
  }
  if (toys.length && r < 0.52) {
    const t = pick(toys);
    const tp = t.obj.position;
    goTo(p, tp.x + rand(-0.5, 0.5), tp.z + rand(0.6, 1.0), () => {
      p.happy(2.8); p.jump(0.7); barkOf(p);
      // 用鼻子把玩具拱开（真碰撞）
      if (t.body) {
        const dx = tp.x - p.root.position.x, dz = tp.z - p.root.position.z;
        const d = Math.hypot(dx, dz) || 1;
        t.body.kick(dx / d * rand(2.2, 3.6), dz / d * rand(2.2, 3.6), rand(1.6, 3));
      }
      particle3(headPos(p), pick(['🎵', '✨', '💛']), 2);
      if (Math.random() < 0.5) addHearts(1);
      if (Math.random() < 0.2) elfSay('看！它玩得多开心呀！', 'play');
    }, true);
    return;
  }
  const cushion = furniList.find(f => f.def.id === 'cushion');
  if (cushion && r < 0.64) {
    goTo(p, cushion.obj.position.x, cushion.obj.position.z, () => {
      p.setMode('sit'); p.happy(3.5);
      setTimeout(() => { if (p.mode === 'sit') p.setMode('idle'); }, 5000);
    });
  } else if (r < 0.9) {
    goTo(p, rand(bounds.x0 + 0.6, bounds.x1 - 0.6), rand(bounds.z0 + 0.6, bounds.z1 - 0.4));
  } else {
    p.happy(1.6);
  }
}

/* ---------------- 家具 ---------------- */
let furniList = [];            // {def, obj, body, stat}
function decorPos(f) {
  const d = state.decor[f.id];
  if (!d) return null;
  if (typeof d.z === 'number') return { x: d.x, z: d.z };
  // v0.4 及更早：屏幕比例 → 世界坐标
  return {
    x: clamp((d.x - 0.5) * 10.4, bounds.x0 + 0.6, bounds.x1 - 0.6),
    z: clamp((d.y - 0.7) * 9.5, bounds.z0 + 0.6, bounds.z1 - 0.6),
  };
}
function saveDecor(f, x, z) { state.decor[f.id] = { x, z }; }

function spawnFurni(f) {
  const pos = decorPos(f) || { x: rand(-2, 2), z: rand(-1, 2) };
  const obj = buildFurni(f.kind);
  obj.userData.pick = { type: 'furni', id: f.id };
  const rec = { def: f, obj };
  if (f.zone === 'wall') {
    obj.position.set(clamp(pos.x, -4.5, 4.5), 2.6, -5.4);
    obj.userData.wall = true;
  } else {
    obj.position.set(pos.x, 0, pos.z);
    if (f.dyn) {
      recenter(obj, f.cy);
      obj.position.y = f.r;
      rec.body = phys.addBody(new Body(obj, f.r, {
        hitR: f.hitR, rest: f.id === 'ball' ? 0.62 : 0.35, fric: f.id === 'ball' ? 1.2 : 3.2,
      }));
      rec.stat = phys.addStatic({ x: pos.x, z: pos.z, r: f.hitR, soft: true, body: rec.body });
    } else {
      rec.stat = phys.addStatic({ x: pos.x, z: pos.z, r: f.r, soft: f.id === 'cushion' || f.id === 'bed' });
    }
  }
  worldRoot.add(obj);
  furniList.push(rec);
  if (f.id === 'lamp') lampLight = obj.userData.lamp;
  return rec;
}
let lampLight = null;
/* 把模型往下挪，使 group 原点落在质心 —— 物理体绕质心旋转才不会穿地 */
function recenter(obj, cy) {
  for (const c of obj.children) c.position.y -= cy;
}
function wiggleFurni(id) {
  const rec = furniList.find(r => r.def.id === id);
  if (!rec) return;
  if (rec.body) rec.body.kick(rand(-1.5, 1.5), rand(-1.5, 1.5), 2.4);
  else rec._wig = 0.6;
}

/* ---------------- 场景 ---------------- */
let roomG = null, parkG = null, bowlG = null, waterG = null, tubG = null, dreamStars = null;
function clearWorld() {
  pets.forEach(p => p.dispose());
  pets = [];
  if (friend) { friend.dispose(); friend = null; }
  nurseryPets.forEach(p => p.dispose());
  nurseryPets = [];
  stopParkLife();
  // 洗澡/梳毛状态跟着场景一起清干净，免得切场景后卡在"正在洗澡"
  bathOpen = false; groomMode = false; tubStat = null; bubbles3 = [];
  while (worldRoot.children.length) worldRoot.remove(worldRoot.children[0]);
  furniList = [];
  lampLight = null;
  phys.reset(bounds);
  roomG = parkG = bowlG = waterG = tubG = dreamStars = null;
  game.querySelectorAll('#hud,#speech,#toolbar,.tray,#shop,#bath-meter,#wardrobe,#adopt-house,#night').forEach(n => n.remove());
}

function spawnPets(spots) {
  pets = state.pets.map((d, i) => {
    const p = newPet(d.breed, d.name, { idx: i, equipped: d.equipped });
    const sp = spots[i] || [rand(-2, 2), rand(0, 2)];
    p.setPos(sp[0], sp[1]);
    p.heading = p.headingT = Math.PI * (0.05 + Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1);
    worldRoot.add(p.root);
    phys.agents.push(p.agent);
    return p;
  });
}

function buildHome(entering) {
  sceneName = 'home';
  bounds = HOME_BOUNDS;
  clearWorld();
  ENG.setRig('home');
  roomG = buildRoom();
  worldRoot.add(roomG);

  bowlG = buildBowl('food'); bowlG.position.set(BOWL.x, 0, BOWL.z); worldRoot.add(bowlG);
  waterG = buildBowl('water'); waterG.position.set(WATER.x, 0, WATER.z); worldRoot.add(waterG);
  phys.addStatic({ x: BOWL.x, z: BOWL.z, r: 0.55, soft: true });
  phys.addStatic({ x: WATER.x, z: WATER.z, r: 0.55, soft: true });

  for (const f of FURNI) if (state.decor[f.id]) spawnFurni(f);

  elf = buildElf();
  elf.position.set(3.6, 2.6, 2.4);
  worldRoot.add(elf);

  // 夜晚的小星星（只有天黑才亮）
  dreamStars = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0 }));
    s.position.set(rand(-5, 5), rand(3.4, 5.4), rand(-5, 2));
    s.userData.ph = rand(0, 6);
    dreamStars.add(s);
  }
  worldRoot.add(dreamStars);

  const spots = entering === 'fromPark'
    ? state.pets.map((_, i) => [3.4 - i * 0.9, -3.4 + i * 0.5])
    : state.pets.map((_, i) => [-1.4 + i * 1.4, 0.4 + (i % 2) * 1.2]);
  spawnPets(spots);

  buildUI('home');
}

function buildParkScene() {
  sceneName = 'park';
  bounds = PARK_BOUNDS;
  clearWorld();
  ENG.setRig('park');
  parkG = buildPark();
  worldRoot.add(parkG);

  elf = buildElf();
  elf.position.set(4.5, 3.0, 3.0);
  worldRoot.add(elf);

  spawnPets(state.pets.map((_, i) => [-1.6 + i * 1.5, 1.2 + (i % 2) * 1.0]));

  const others = Object.keys(BREEDS).filter(k => !state.pets.some(p => p.breed === k));
  const fb = pick(others.length ? others : Object.keys(BREEDS));
  friend = newPet(fb, BREEDS[fb].label, { npc: true, equipped: [pick(['bow', 'strawhat', 'partyhat', 'flower'])] });
  friend.setPos(rand(-6, -4), rand(-1, 1));
  worldRoot.add(friend.root);
  phys.agents.push(friend.agent);

  buildUI('park');
  startParkLife();
  elfSay('哇，公园到啦！扔小球给它们捡吧，还有蝴蝶可以追～', 'park_go', 5500);
}

function goPark() {
  if (nightOn || bathOpen || groomMode) return;
  sfx.chime(); voice('park_out');
  transition(() => buildParkScene());
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

/* ---------------- 输入：拾取 / 抚摸 / 拖家具 / 环视 ---------------- */
let drag = null;
function pickRoots() {
  return [worldRoot];
}
function onDown(e) {
  if (e.target.closest('#hud,#toolbar,.drawer,.tray,#adopt,#bath-meter')) return;
  const hit = pickAt(e.clientX, e.clientY, pickRoots());
  const info = hit && hit.target.userData.pick;

  if (info && info.type === 'pet') {
    const p = info.pet;
    if (nurseryMode) { nurseryPick(p); return; }
    if (!p.npc && state.active !== p.idx) setActive(p.idx);
    if (p.mode === 'sleep') { drag = null; return; }
    drag = { kind: 'stroke', pet: p, lx: e.clientX, ly: e.clientY };
    p.jump(0.45); barkOf(p);
    p.lookAtPoint(hit.point);
    return;
  }
  if (info && info.type === 'furni') {
    const rec = furniList.find(r => r.def.id === info.id);
    if (rec && !rec.obj.userData.wall) {
      drag = { kind: 'furni', rec, moved: false, lastX: e.clientX, lastY: e.clientY, hist: [] };
      sfx.pip();
      if (rec.body) rec.body.sleep = false;
      return;
    }
  }
  if (info && info.type === 'door') { goPark(); return; }
  if (info && info.type === 'elf') { elfTip(); return; }
  if (info && info.type === 'butterfly') { chaseButterfly(info.obj); return; }
  if (info && info.type === 'bubble') { popBubble(info.obj); return; }
  if (info && info.type === 'bowl' && info.kind === 'water') {
    sfx.bubble();
    particle3(waterG.position, '💧', 2);
    return;
  }
  drag = { kind: 'orbit', lx: e.clientX };
}
function onMove(e) {
  if (!drag) return;
  if (drag.kind === 'orbit') {
    ENG.nudgeOrbit(-(e.clientX - drag.lx));
    drag.lx = e.clientX;
    return;
  }
  if (drag.kind === 'stroke') {
    const p = drag.pet;
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
    drag.lx = e.clientX; drag.ly = e.clientY;
    p.strokeAcc += Math.hypot(dx, dy);
    if (bathOpen && p === APet()) { scrubProgress(e.clientX, e.clientY); return; }
    if (p.strokeAcc > 80) {
      p.strokeAcc = 0;
      if (groomMode && p === APet()) { groomProgress(e.clientX, e.clientY); return; }
      p.happy(1.8);
      particle(e.clientX, e.clientY, '💗');
      sfx.pop();
      if (p.cat && Math.random() < 0.4) sfx.purr();
      p.petStreak++;
      if (p.petStreak >= 5) {
        p.petStreak = 0;
        trick(p); addHearts(3);
        if (Math.random() < 0.5) elfSay(p.cat ? '它舒服得直打呼噜～' : '它开心得转圈圈啦！', 'play');
      } else {
        if (Math.random() < 0.15) barkOf(p);
        if (Math.random() < 0.1) elfSay('它喜欢你摸摸它呢～', 'stroke1');
        if (Math.random() < 0.25) addHearts(1);
      }
    }
    return;
  }
  if (drag.kind === 'furni') {
    const g = groundAt(e.clientX, e.clientY);
    if (!g) return;
    drag.moved = true;
    const rec = drag.rec;
    const x = clamp(g.x, bounds.x0 + 0.3, bounds.x1 - 0.3);
    const z = clamp(g.z, bounds.z0 + 0.3, bounds.z1 - 0.3);
    if (rec.body) {
      rec.body.vel.set(0, 0, 0);
      rec.obj.position.set(x, rec.def.r + 0.9, z);      // 拎起来
      drag.hist.push({ x, z, t: performance.now() });
      if (drag.hist.length > 5) drag.hist.shift();
    } else {
      rec.obj.position.set(x, rec.obj.position.y, z);
    }
    if (rec.stat) { rec.stat.x = x; rec.stat.z = z; }
  }
}
function onUp() {
  if (!drag) return;
  if (drag.kind === 'orbit') ENG.releaseOrbit();
  if (drag.kind === 'furni') {
    const rec = drag.rec;
    if (rec.body && drag.hist.length > 1) {
      const a = drag.hist[0], b = drag.hist[drag.hist.length - 1];
      const dt = Math.max(0.016, (b.t - a.t) / 1000);
      rec.body.kick(clamp((b.x - a.x) / dt, -9, 9), clamp((b.z - a.z) / dt, -9, 9), 2.2);
      sfx.pop();
    } else if (drag.moved) {
      sfx.pop();
      saveDecor(rec.def, rec.obj.position.x, rec.obj.position.z);
      save();
    }
    if (rec.body) rec.body.sleep = false;
  }
  drag = null;
}

/* ---------------- UI ---------------- */
let chipsEl;
const thumbCache = new Map();
function petThumb(breed, equipped) {
  const key = breed + '|' + (equipped || []).join(',');
  if (thumbCache.has(key)) return thumbCache.get(key);
  const p = new Pet3D(breed, '', { equipped });
  p.root.rotation.y = 0.35;
  const url = ENG.snapshot(p.root, 150, [0, 1.35, 2.5], [0, 0.95, 0], 34);
  thumbCache.set(key, url);
  return url;
}
function furniThumb(f) {
  const key = 'f:' + f.id;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const o = buildFurni(f.kind);
  const url = ENG.snapshot(o, 150, [1.6, 1.9, 2.6], [0, 0.5, 0], 34);
  thumbCache.set(key, url);
  return url;
}

function buildUI(kind) {
  const hud = $(`<div id="hud">
    <div id="heart-pill"><span class="hicon">💗</span><span class="hnum">${Math.round(state.hearts)}</span></div>
    <div id="chips"></div>
  </div>`);
  game.appendChild(hud);
  heartPill = hud.querySelector('#heart-pill');
  chipsEl = hud.querySelector('#chips');
  chipsEl.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.chip');
    if (!c) return;
    if (c.dataset.add !== undefined) { openAdoptHouse(); return; }
    setActive(+c.dataset.i);
  });
  refreshChips();

  speechEl = $('<div id="speech"></div>');
  game.appendChild(speechEl);

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
        <button class="btn go-park" data-act="park"><span>🌳</span><i>去公园</i></button>
      </div>`);
  bar.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (!b) return;
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
function elfTip() {
  sfx.sparkle();
  elfSay(pick(sceneName === 'park' ? [
    '扔小球，它们会飞快地捡回来哦！',
    '轻轻点一下蝴蝶试试～',
    '带它们认识新朋友吧！',
  ] : [
    `多陪陪${activePet().name}，爱心就会越来越多哦！`,
    '木门那边就是公园，可以出去遛弯～',
    '按住小球一甩，它就会滚起来撞到小家伙啦！',
    '空白的地方拖一拖，可以换个角度看小窝～',
  ]), pick(['elf1', 'elf2']));
}

function refreshChips() {
  if (!chipsEl) return;
  let html = '';
  state.pets.forEach((p, i) => {
    html += `<div class="chip${i === state.active ? ' on' : ''}" data-i="${i}">
      <img class="chip-art" src="${petThumb(p.breed, p.equipped)}" alt=""></div>`;
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
  if (p) { p.jump(0.6); p.happy(1.6); }
}

/* ---------------- 吃饭 ---------------- */
let trayEl;
const FOODS = [['🦴', '大骨头'], ['🍖', '肉肉'], ['🐟', '小鱼干'], ['🥛', '牛奶']];
function buildTray() {
  trayEl = $(`<div class="tray">${FOODS.map((f, i) => `<div class="food" data-i="${i}">${f[0]}</div>`).join('')}</div>`);
  trayEl.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.food');
    if (!el) return;
    trayEl.classList.remove('show');
    serveFood(FOODS[+el.dataset.i][0], e.clientX, e.clientY);
  });
  game.appendChild(trayEl);
}
function openTray() {
  if (nightOn || bathOpen) return;
  trayEl.classList.toggle('show');
}
function serveFood(emoji, fromX, fromY) {
  const bp = toScreen(bowlG.position, {});
  const fly = $(`<div class="pfx" style="animation:none;font-size:7vmin">${emoji}</div>`);
  fly.style.left = fromX + 'px'; fly.style.top = fromY + 'px';
  fly.style.transition = 'all .55s cubic-bezier(.4,0,.6,1)';
  fxLayer.appendChild(fly);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fly.style.left = bp.x + 'px'; fly.style.top = bp.y + 'px';
    fly.style.transform = 'scale(.55)';
  }));
  sfx.pop();
  setTimeout(() => {
    fly.remove();
    bowlG.userData.kibble.visible = true;
    let done = 0;
    pets.forEach((p, i) => {
      const a = -0.5 + i * 0.55;
      goTo(p, BOWL.x + Math.sin(a) * 1.15, BOWL.z + Math.cos(a) * 1.15, () => {
        p.faceTo(BOWL.x, BOWL.z);
        p.setMode('eat');
        let n = 0;
        const munchT = setInterval(() => {
          sfx.munch();
          particle3(bowlG.position, pick(['✦', '·']), 1);
          if (++n >= 5) {
            clearInterval(munchT);
            p.setMode('idle');
            p.happy(3); p.jump(0.6); barkOf(p);
            if (++done === pets.length) {
              bowlG.userData.kibble.visible = false;
              state.stats.hunger = 100; save();
              addHearts(5 * pets.length, bowlG.position);
              elfSay(pets.length > 1 ? '大家都吃饱啦，肚子圆滚滚！' : '吃得真香呀～肚子圆滚滚！', 'feed_done');
            }
          }
        }, 550);
      }, true);
    });
  }, 600);
}

/* 在候选点里挑一块离家具最远的空地（放浴缸用，免得跟狗窝穿模） */
function freeSpot(need) {
  const cands = [];
  for (let x = -2.6; x <= 2.6; x += 1.3) for (let z = -1.6; z <= 2.0; z += 1.2) cands.push({ x, z });
  let best = cands[0], bestD = -1;
  for (const c of cands) {
    let d = Math.min(
      c.x - bounds.x0, bounds.x1 - c.x, c.z - bounds.z0, bounds.z1 - c.z,
      Math.hypot(c.x - BOWL.x, c.z - BOWL.z), Math.hypot(c.x - WATER.x, c.z - WATER.z));
    for (const rec of furniList) {
      if (rec.obj.userData.wall) continue;
      d = Math.min(d, Math.hypot(c.x - rec.obj.position.x, c.z - rec.obj.position.z) - rec.def.r);
    }
    if (d > bestD) { bestD = d; best = c; }
  }
  return best;
}

/* ---------------- 洗澡（场景内 3D）---------------- */
let bathScrub = 0, bathMeter = null, bubbles3 = [], tubStat = null;
function buildBathMeter() {
  bathMeter = $(`<div id="bath-meter"><span class="st">✨</span><span class="st">✨</span><span class="st">✨</span></div>`);
  game.appendChild(bathMeter);
}
function openBath() {
  if (nightOn || bathOpen || sceneName !== 'home') return;
  const p = APet();
  bathScrub = 0;
  const spot = freeSpot(1.7);              // 找一块没家具的空地放浴缸
  tubG = buildTub();
  tubG.position.set(spot.x, 0, spot.z);
  tubG.scale.setScalar(0.01);
  worldRoot.add(tubG);
  // 浴缸是实心的：别的小家伙不能穿过去（洗澡那只自己进缸，走 noPush）
  tubStat = phys.addStatic({ x: spot.x, z: spot.z, r: 1.55 });
  p.inTub = true;                          // 先放行，不然它被自己的浴缸挡在外面
  for (const o of pets) {
    if (o === p) continue;
    stopPet(o);
    const dx = o.root.position.x - spot.x, dz = o.root.position.z - spot.z;
    const d = Math.hypot(dx, dz) || 1;
    goTo(o, spot.x + dx / d * 2.6, spot.z + dz / d * 2.6);
  }
  const grow = setInterval(() => {
    tubG.scale.multiplyScalar(1.35);
    if (tubG.scale.x >= 1) { tubG.scale.setScalar(1); clearInterval(grow); }
  }, 24);
  sfx.splash();
  elfSay(`哗啦啦～带${p.name}泡个澡，在它身上搓出好多泡泡吧！`, 'bath_start', 5200);
  goTo(p, spot.x, spot.z + 0.05, () => {
    bathOpen = true;
    p.setMode('idle');
    p.faceTo(spot.x, spot.z + 6);
    p.bathLift = 0.55;
    bathMeter.classList.add('show');
    bathMeter.querySelectorAll('.st').forEach(s => s.classList.remove('lit'));
  }, true);
}
function scrubProgress(sx, sy) {
  bathScrub += 24;
  if (Math.random() < 0.75) spawnBubble3(APet());
  sfx.bubble();
  const lit = Math.min(3, Math.floor(bathScrub / 260));
  bathMeter.querySelectorAll('.st').forEach((s, i) => s.classList.toggle('lit', i < lit));
  APet().happy(1.6);
  if (lit >= 3) finishBath();
}
function spawnBubble3(p) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(rand(0.09, 0.2), 10, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.03, metalness: 0.1,
      transparent: true, opacity: 0.55,
    }));
  b.position.set(p.root.position.x + rand(-0.5, 0.5), rand(0.8, 1.5), p.root.position.z + rand(-0.4, 0.4));
  b.userData.v = rand(0.5, 1.1);
  worldRoot.add(b);
  bubbles3.push(b);
  if (bubbles3.length > 40) { const o = bubbles3.shift(); worldRoot.remove(o); }
}
function finishBath() {
  if (!bathOpen) return;
  bathOpen = false;
  const p = APet();
  sfx.splash(); sfx.sparkle();
  bathMeter.classList.remove('show');
  setTimeout(() => {
    p.shake();
    for (let i = 0; i < 10; i++) spawnBubble3(p);
    p.bathLift = 0;
    p.inTub = false;
    if (tubStat) { phys.removeStatic(tubStat); tubStat = null; }
    state.stats.clean = 100; save();
    p.happy(3.2); barkOf(p);
    addHearts(8, headPos(p));
    elfSay('哇，香喷喷亮晶晶！', 'bath_done');
    if (tubG) {
      const t = tubG; tubG = null;
      const shrink = setInterval(() => {
        t.scale.multiplyScalar(0.82);
        if (t.scale.x < 0.02) { clearInterval(shrink); worldRoot.remove(t); }
      }, 24);
    }
    goTo(p, rand(-1.5, 1.5), rand(0, 2));
  }, 700);
}

/* ---------------- 梳毛 ---------------- */
let groomCount = 0;
function startGroom() {
  if (nightOn || bathOpen || groomMode) return;
  groomMode = true; groomCount = 0;
  const p = APet();
  stopPet(p); p.setMode('sit');
  elfSay(`在${activePet().name}身上轻轻划一划，做个美容～`, 'brush_start', 5000);
}
function groomProgress(x, y) {
  groomCount++;
  sfx.brush();
  particle(x, y, pick(['✨', '🫧']));
  APet().happy(1.6);
  if (groomCount >= 10) {
    groomMode = false;
    sfx.sparkle();
    const p = APet();
    p.setMode('idle'); p.jump(0.8); barkOf(p);
    addHearts(5, headPos(p));
    elfSay('毛毛梳得顺顺的，真漂亮！', 'brush_done');
  }
}

/* ---------------- 睡觉 ---------------- */
let nightTimer;
function toggleNight() {
  if (bathOpen || sceneName !== 'home') return;
  if (!nightOn) {
    nightOn = true;
    ENG.setNight(true);
    game.classList.add('is-night');
    trayEl.classList.remove('show');
    closeDrawers();
    const bed = furniList.find(f => f.def.id === 'bed');
    pets.forEach((p, i) => {
      const off = (i - (pets.length - 1) / 2) * 0.75;
      const gx = bed ? bed.obj.position.x + off : off;
      const gz = bed ? bed.obj.position.z : 0.5;
      goTo(p, gx, gz, () => { p.setMode('sleep'); p.faceTo(gx, gz + 3); });
    });
    sfx.night();
    elfSay('嘘——宝贝们要睡觉啦，晚安～', 'sleep', 5000);
    nightTimer = setTimeout(morning, 9000);
  } else {
    clearTimeout(nightTimer);
    morning();
  }
}
function morning() {
  if (!nightOn) return;
  nightOn = false;
  ENG.setNight(false);
  game.classList.remove('is-night');
  pets.forEach(p => { p.setMode('idle'); p.jump(0.7); p.happy(3); });
  barkOf(APet());
  state.stats.energy = 100; save();
  sfx.chime();
  addHearts(3 * pets.length, headPos(APet()));
  elfSay('早上好呀！睡饱饱，精神好！', 'wake');
}

/* ---------------- 商店 ---------------- */
function buildShop() {
  const shop = $(`<div id="shop" class="drawer"><h3>温暖小家具 <button class="btn dclose">✕</button></h3><div class="dlist"></div></div>`);
  const list = shop.querySelector('.dlist');
  for (const f of FURNI) {
    const item = $(`<div class="shop-item" data-id="${f.id}">
      <div class="thumb"><img src="${furniThumb(f)}" alt=""></div>
      <div class="info"><div class="name">${f.name}</div><div class="price">💗 ${f.price}</div></div>
    </div>`);
    item.addEventListener('pointerdown', () => buyFurni(f));
    list.appendChild(item);
  }
  shop.querySelector('.dclose').addEventListener('pointerdown', () => { shop.classList.remove('show'); sfx.pip(); });
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
  saveDecor(f, rand(-2.6, 2.6), rand(-1.5, 2.4));
  if (f.zone === 'wall') saveDecor(f, rand(-3, 3), 0);
  save();
  const rec = spawnFurni(f);
  refreshShop();
  sfx.ding(); sfx.sparkle();
  document.getElementById('shop').classList.remove('show');
  particle3(rec.obj.position, '✨', 4);
  elfSay('放这里真不错！按住它还能挪位置，玩具还能甩出去哦～', 'placed', 5200);
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
      <div class="thumb cloth-thumb"><span>${c.icon}</span></div>
      <div class="info"><div class="name">${c.name}</div><div class="price"></div></div>
    </div>`);
    item.addEventListener('pointerdown', () => tapCloth(c));
    list.appendChild(item);
  }
  wd.querySelector('.dclose').addEventListener('pointerdown', () => { wd.classList.remove('show'); sfx.pip(); });
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
  refreshChips();
}
function openWardrobe() {
  if (nightOn || bathOpen) return;
  closeDrawers('wardrobe');
  refreshWardrobe();
  document.getElementById('wardrobe').classList.add('show');
  elfSay('给它挑一件漂亮衣服吧！', 'dress_open');
}

/* ---------------- 领养屋 ---------------- */
function buildAdoptHouse() {
  const ah = $(`<div id="adopt-house" class="drawer"><h3>领养小屋 <button class="btn dclose">✕</button></h3>
    <div class="dlist"></div></div>`);
  ah.querySelector('.dclose').addEventListener('pointerdown', () => { ah.classList.remove('show'); sfx.pip(); });
  game.appendChild(ah);
}
function refreshAdoptHouse() {
  const list = document.querySelector('#adopt-house .dlist');
  if (!list) return;
  const price = ADOPT_PRICE[state.pets.length] ?? 999;
  const full = state.pets.length >= MAX_PETS;
  list.innerHTML = '';
  if (full) {
    list.appendChild($(`<div class="ah-note">小窝住满啦～<br>四个小家伙已经很热闹咯！</div>`));
    return;
  }
  list.appendChild($(`<div class="ah-note">再接一个小伙伴回家<br>需要 💗 ${price}</div>`));
  for (const key of Object.keys(BREEDS)) {
    const b = BREEDS[key];
    const item = $(`<div class="shop-item ah-item" data-b="${key}">
      <div class="thumb ah-thumb"><img src="${petThumb(key, [])}" alt=""></div>
      <div class="info"><div class="name">${b.label}</div>
      <div class="price">${b.kind === 'cat' ? '🐱 小猫' : '🐶 小狗'} · 💗 ${price}</div></div>
    </div>`);
    item.addEventListener('pointerdown', () => adoptNew(key, price));
    list.appendChild(item);
  }
}
function openAdoptHouse() {
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
  p.setPos(3.5, -4.2);
  worldRoot.add(p.root);
  phys.agents.push(p.agent);
  pets.push(p);
  goTo(p, rand(-1.5, 1.5), rand(0.5, 2.2), () => { trick(p); p.happy(3); }, true);

  refreshChips();
  refreshAdoptHouse();
  document.getElementById('adopt-house').classList.remove('show');
  sfx.ding(); sfx.sparkle();
  voice('adopt_new');
  elfSay(`欢迎${name}回家！现在有 ${state.pets.length} 个小伙伴啦～`, null, 5200);
}

/* ---------------- 公园玩法 ---------------- */
let parkTimers = [], ballBusy = false, friendCooldown = 0;
let butterflies = [], parkBubbles = [], fetchBall = null;
function startParkLife() {
  for (let i = 0; i < 3; i++) {
    const bf = buildButterfly(pick(['#f2a0c4', '#a8d8f0', '#ffd766']));
    bf.position.set(rand(-4, 4), rand(1.1, 1.9), rand(-2, 1.5));
    bf.userData.t = rand(0, 99);
    bf.userData.home = bf.position.clone();
    worldRoot.add(bf);
    butterflies.push(bf);
  }
  parkTimers.push(setInterval(() => {
    if (!friend || sceneName !== 'park') return;
    for (const p of pets) {
      const d = Math.hypot(p.root.position.x - friend.root.position.x, p.root.position.z - friend.root.position.z);
      if (d < 1.6 && Date.now() > friendCooldown) {
        friendCooldown = Date.now() + 12000;
        trick(p);
        friend.jump(1);
        friend.happy(3);
        addHearts(4, headPos(p));
        elfSay(`${p.name}交到新朋友啦！`, 'park_friend');
        sfx.sparkle();
        return;
      }
    }
  }, 800));
}
function stopParkLife() {
  parkTimers.forEach(clearInterval);
  parkTimers = [];
  ballBusy = false;
  butterflies = []; parkBubbles = []; fetchBall = null;
}
function chaseButterfly(bf) {
  sfx.sparkle();
  particle3(bf.position, '✨', 3);
  bf.userData.flee = 1.2;
  const chaser = APet();
  goTo(chaser, clamp(bf.position.x, bounds.x0 + 1, bounds.x1 - 1),
    clamp(bf.position.z + 0.8, bounds.z0 + 1, bounds.z1 - 1), () => {
      trick(chaser);
      addHearts(2, headPos(chaser));
      if (Math.random() < 0.5) elfSay('追到蝴蝶啦，好厉害！', 'park_butterfly');
    }, true);
}
function throwBall() {
  if (ballBusy || !pets.length || sceneName !== 'park') return;
  ballBusy = true;
  sfx.pop(); voice('park_ball');
  const g = buildFurni('ball');
  recenter(g, 0.34);
  g.position.set(0, 2.2, 4.6);
  worldRoot.add(g);
  const body = phys.addBody(new Body(g, 0.34, { hitR: 0.4, rest: 0.62, fric: 1.0 }));
  const tx = rand(-4.5, 4.5), tz = rand(-4, 1);
  const dx = tx - g.position.x, dz = tz - g.position.z;
  const d = Math.hypot(dx, dz);
  body.kick(dx / d * 6.5, dz / d * 6.5, 4.2);
  fetchBall = { g, body, fetched: false };

  const runner = APet();
  setTimeout(() => {
    if (!fetchBall) return;
    goTo(runner, g.position.x, g.position.z + 0.5, () => {
      if (!fetchBall) return;
      // 叼住球
      fetchBall.fetched = true;
      phys.removeBody(body);
      runner.headPivot.add(g);
      g.position.set(0, -runner.headR * 0.5, runner.headR * 1.15);
      g.scale.setScalar(0.8);
      sfx.pip(); barkOf(runner);
      goTo(runner, rand(-1.5, 1.5), rand(2, 3.5), () => {
        runner.headPivot.remove(g);
        g.scale.setScalar(1);
        g.position.set(runner.root.position.x, 0.34, runner.root.position.z + 0.8);
        worldRoot.add(g);
        phys.addBody(body);
        body.kick(rand(-1, 1), rand(0.5, 1.5), 1.2);
        trick(runner);
        addHearts(3, headPos(runner));
        elfSay(pick(['捡回来啦！再扔一次？', `${runner.name}跑得好快呀！`]), 'park_fetch');
        setTimeout(() => {
          worldRoot.remove(g); phys.removeBody(body);
          fetchBall = null; ballBusy = false;
        }, 2600);
      }, true);
    }, true);
  }, 900);
}
function blowBubbles() {
  sfx.bubble();
  for (let i = 0; i < 8; i++) {
    const r = rand(0.16, 0.34);
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.02, metalness: 0.25,
        transparent: true, opacity: 0.42,
      }));
    b.position.set(rand(-4, 4), rand(0.6, 1.4), rand(0, 3.5));
    b.userData.v = rand(0.4, 0.9);
    b.userData.pick = { type: 'bubble', obj: b };
    worldRoot.add(b);
    parkBubbles.push(b);
    setTimeout(() => popBubble(b, true), 6000 + i * 200);
  }
  pets.forEach(p => { if (p.mode === 'idle') p.happy(2.5); });
}
function popBubble(b, silent) {
  if (!b.parent) return;
  worldRoot.remove(b);
  parkBubbles = parkBubbles.filter(x => x !== b);
  if (silent) return;
  sfx.bubble();
  particle3(b.position, '💧', 2);
  if (Math.random() < 0.4) addHearts(1);
}

/* ---------------- 宠物之间互动 ---------------- */
setInterval(() => {
  if (sceneName !== 'home' || nightOn || bathOpen || pets.length < 2) return;
  const now = Date.now();
  for (let i = 0; i < pets.length; i++) {
    for (let j = i + 1; j < pets.length; j++) {
      const a = pets[i], b = pets[j];
      if (a.mode !== 'idle' || b.mode !== 'idle') continue;
      if (now < a.buddyCd || now < b.buddyCd) continue;
      if (Math.hypot(a.root.position.x - b.root.position.x, a.root.position.z - b.root.position.z) < 1.5) {
        a.buddyCd = b.buddyCd = now + 15000;
        a.faceTo(b.root.position.x, b.root.position.z);
        b.faceTo(a.root.position.x, a.root.position.z);
        trick(a); b.happy(2.6); b.jump(0.7);
        addHearts(2, headPos(a));
        if (Math.random() < 0.45) elfSay(`${a.name}和${b.name}玩到一起啦！`, 'buddies');
        return;
      }
    }
  }
}, 1500);

/* ---------------- 状态衰减 ---------------- */
setInterval(() => {
  if (!pets.length || nightOn) return;
  state.stats.hunger = Math.max(0, state.stats.hunger - 0.5);
  state.stats.clean = Math.max(0, state.stats.clean - 0.35);
  save();
  if (sceneName !== 'home') return;
  if (state.stats.hunger < 42 && Math.random() < 0.5) {
    if (Math.random() < 0.4) elfSay('咕噜咕噜～小肚子在叫啦，我们喂点好吃的吧！', 'hungry');
  } else if (state.stats.clean < 40 && Math.random() < 0.4) {
    if (Math.random() < 0.4) elfSay('身上有点脏脏啦，洗个泡泡澡吧！', 'dirty');
  }
}, 12000);

/* ---------------- 主循环 ---------------- */
onTick((dt, time) => {
  // 宠物移动
  for (const p of (friend ? pets.concat(friend) : pets)) {
    if (p.tx !== null) {
      const dx = p.tx - p.root.position.x, dz = p.tz - p.root.position.z;
      const d = Math.hypot(dx, dz);
      const spd = p.moveSpeed * (p.running ? 1.55 : 1);
      if (d < 0.16) {
        p.tx = p.tz = null;
        p.setMode('idle');
        p.speed = 0;
        p.agent.vx = p.agent.vz = 0;
        const f = p.onArrive; p.onArrive = null;
        if (f) f();
      } else {
        const step = Math.min(spd * dt, d);
        p.root.position.x += dx / d * step;
        p.root.position.z += dz / d * step;
        p.headingT = Math.atan2(dx, dz);
        p.speed = spd;
        p.agent.vx = dx / d * spd; p.agent.vz = dz / d * spd;
      }
    } else if (p.mode === 'idle' && time > p.nextThink && !nightOn && !bathOpen && !groomMode) {
      p.nextThink = time + rand(3.5, 8);
      autonomy(p);
    }
    p.agent.noPush = p.mode === 'sleep' || p.mode === 'eat' || !!p.inTub;
    p.agent.ghost = !!p.inTub;
    // 洗澡时站在浴缸里
    const lift = p.bathLift || 0;
    p.root.position.y += (lift - p.root.position.y) * Math.min(1, dt * 6);
    p.update(dt, time);
  }
  for (const p of nurseryPets) p.update(dt, time);

  phys.resolveAgents();
  phys.step(dt);

  // 动态玩具的静态碰撞体跟着跑
  for (const rec of furniList) {
    if (rec.body && rec.stat) { rec.stat.x = rec.obj.position.x; rec.stat.z = rec.obj.position.z; }
    if (rec._wig > 0) {
      rec._wig -= dt;
      rec.obj.rotation.z = Math.sin(rec._wig * 40) * 0.12 * Math.max(0, rec._wig / 0.6);
      if (rec._wig <= 0) rec.obj.rotation.z = 0;
    }
  }

  // 小精灵飞舞
  if (elf) {
    const t = time * 0.8;
    elf.position.y += (Math.sin(time * 1.8) * 0.004);
    elf.position.x += Math.sin(t * 0.7) * 0.004;
    elf.rotation.y = Math.sin(t) * 0.6;
    for (const { w, s } of elf.userData.wings) w.rotation.z = s * (0.5 + Math.sin(time * 26) * 0.5);
    placeSpeech();
  }

  // 洗澡泡泡上浮
  for (let i = bubbles3.length - 1; i >= 0; i--) {
    const b = bubbles3[i];
    b.position.y += b.userData.v * dt;
    b.position.x += Math.sin(time * 2 + i) * 0.002;
    b.material.opacity -= dt * 0.22;
    if (b.material.opacity <= 0.02) { worldRoot.remove(b); bubbles3.splice(i, 1); }
  }
  // 公园泡泡
  for (const b of parkBubbles) {
    b.position.y += b.userData.v * dt;
    b.position.x += Math.sin(time * 1.6 + b.position.z) * 0.004;
  }
  // 蝴蝶
  for (let i = 0; i < butterflies.length; i++) {
    const bf = butterflies[i];
    bf.userData.t += dt;
    const t = bf.userData.t, h = bf.userData.home;
    const flee = bf.userData.flee || 0;
    if (flee > 0) bf.userData.flee = Math.max(0, flee - dt);
    const rr = flee > 0 ? 3.4 : 1.9;
    bf.position.x = h.x + Math.sin(t * 0.8 + i * 2) * rr;
    bf.position.z = h.z + Math.cos(t * 0.62 + i) * rr * 0.6;
    bf.position.y = h.y + Math.sin(t * 2.1 + i) * 0.4;
    bf.rotation.y = Math.sin(t * 0.8 + i * 2) + Math.PI / 2;
    for (const { w, s } of bf.userData.wings) w.rotation.z = s * (0.2 + Math.sin(time * 24 + i) * 1.0);
  }
  // 池塘小鸭
  if (parkG && parkG.userData.pond) {
    const d = parkG.userData.pond.userData.duck;
    d.position.x = 0.5 + Math.sin(time * 0.5) * 1.1;
    d.position.z = 0.2 + Math.cos(time * 0.4) * 0.9;
    d.rotation.y = Math.sin(time * 0.5) + 1.2;
    d.position.y = 0.2 + Math.sin(time * 2) * 0.02;
  }
  // 浴缸水面 + 小鸭
  if (tubG) {
    const d = tubG.userData.duck;
    d.position.y = 0.62 + Math.sin(time * 2.4) * 0.04;
    d.rotation.z = Math.sin(time * 1.8) * 0.08;
  }
  // 夜晚星星 + 台灯
  if (dreamStars) {
    const on = nightOn ? 1 : 0;
    for (const s of dreamStars.children) {
      s.material.opacity += (on * (0.5 + Math.sin(time * 2 + s.userData.ph) * 0.4) - s.material.opacity) * dt * 2;
      s.position.y += Math.sin(time + s.userData.ph) * 0.0015;
    }
  }
  if (lampLight) lampLight.intensity += ((nightOn ? 2.6 : 0.35) - lampLight.intensity) * dt * 2;
  // 窗户跟着昼夜换色：白天亮蓝天，夜里深蓝 + 月光微亮
  if (roomG && roomG.userData.pane) {
    const m = roomG.userData.pane.material;
    m.color.lerp(_dayPane.set(nightOn ? 0x1d2a55 : 0xa9d8f2), dt * 1.6);
    m.emissive.lerp(_nightPane.set(nightOn ? 0x2a3d70 : 0x9fd0ee), dt * 1.6);
    m.emissiveIntensity += ((nightOn ? 0.35 : 0.55) - m.emissiveIntensity) * dt * 1.6;
  }

  // 天使翅膀扇动
  for (const p of pets) {
    if (!p.wingParts) continue;
    for (const w of p.wingParts) w.rotation.y = (w.position.x > 0 ? 1 : -1) * (0.5 + Math.sin(time * 8) * 0.25);
  }
});

/* ---------------- 首次领养：3D 育婴室 ---------------- */
let nurseryMode = false, nurseryChosen = null, nurseryEl = null;
function buildAdoptScreen() {
  nurseryMode = true;
  sceneName = 'home';
  bounds = HOME_BOUNDS;
  clearWorld();
  ENG.setRig('home');
  roomG = buildRoom();
  worldRoot.add(roomG);
  elf = buildElf();
  elf.position.set(4.2, 2.8, 2.6);
  worldRoot.add(elf);

  const keys = Object.keys(BREEDS);
  keys.forEach((k, i) => {
    const col = i % 4, row = (i / 4) | 0;
    const p = newPet(k, BREEDS[k].label, { idx: i });
    p.setPos(-3.3 + col * 2.2, row === 0 ? -2.2 : 0.9);
    p.headingT = p.heading = 0;
    p.breedKeyRef = k;
    worldRoot.add(p.root);
    nurseryPets.push(p);
    // 站在小垫子上
    const pad = buildFurni('cushion');
    pad.position.set(p.root.position.x, 0, p.root.position.z - 0.1);
    pad.scale.setScalar(0.8);
    worldRoot.add(pad);
    setInterval(() => { if (nurseryMode && Math.random() < 0.4) p.happy(1.4); }, 2600 + i * 300);
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
    sfx.ding(); sfx.sparkle();
    voice('adopt_done');
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
  speechEl = $('<div id="speech"></div>');
  game.appendChild(speechEl);
  setTimeout(() => voice('welcome'), 600);
}
function nurseryPick(p) {
  sfx.unlock(); sfx.pop();
  petVoice(isCat(p.breedKey) ? 'meow' : 'bark');
  nurseryChosen = p.breedKey;
  nurseryPets.forEach(o => {
    o.root.scale.setScalar(o === p ? 1.16 : 0.86);
    if (o === p) { o.jump(1); o.happy(4); }
  });
  nurseryEl.querySelector('.pickname').textContent = `给这只${BREEDS[p.breedKey].label}取个好听的名字吧`;
  setTimeout(() => {
    if (nurseryChosen === p.breedKey) nurseryEl.querySelector('#name-panel').classList.add('show');
  }, 700);
}

/* ---------------- 启动 ---------------- */
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

ENG.initEngine();
const cvs = document.getElementById('stage');
cvs.addEventListener('pointerdown', onDown);
addEventListener('pointermove', onMove);
addEventListener('pointerup', onUp);
addEventListener('pointercancel', onUp);

const hasSave = load();
if (hasSave) buildHome();
else buildAdoptScreen();
ENG.start();

requestAnimationFrame(() => {
  document.getElementById('boot').classList.add('gone');
  setTimeout(() => { const b = document.getElementById('boot'); if (b) b.remove(); }, 700);
});

if (hasSave) {
  setTimeout(() => {
    elfSay(`欢迎回来！${activePet().name}好想你呀～`, null, 4000);
    const p = APet();
    if (p) { p.jump(1); barkOf(p); }
  }, 900);
}

/* 调试直达 */
const dbg = new URLSearchParams(location.search).get('auto');
if (dbg && hasSave) setTimeout(() => {
  ({
    night: toggleNight, bath: openBath, shop: openShop, feed: openTray,
    park: goPark, dress: openWardrobe, adopt: openAdoptHouse,
  })[dbg]?.();
}, 1500);
window.__game = { pets: () => pets, goPark, toggleNight, openBath, state };
/* 调试：?diag=1 把主渲染结果回读成 <img> 覆盖上去 —— 无头 Chrome 不合成 WebGL 画布，
   只有这样才能在离线环境验证真实画面。正常游玩不会进这个分支。 */
const _diag = new URLSearchParams(location.search).get('diag');
if (_diag) setTimeout(() => {
  const c = document.getElementById('stage'), r = ENG.renderer;
  document.title = `DIAG buf=${c.width}x${c.height} css=${c.clientWidth}x${c.clientHeight} `
    + `world=${worldRoot.children.length} calls=${r.info.render.calls} tris=${r.info.render.triangles}`;
  ENG.renderNow();
  const img = document.createElement('img');
  img.src = c.toDataURL('image/png');
  img.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:1;object-fit:cover';
  document.body.insertBefore(img, document.getElementById('game'));
}, +_diag > 1 ? +_diag : 1600);
