/* ============ Ada的宠物小窝 · 主逻辑 v0.3（多宠物 + 小猫 + 领养屋）============ */
import { BREEDS, isCat, petSVG, petSideSVG, elfSVG, tubSVG, bowlSVG, FURNI, CLOTHES,
         roomBgSVG, parkBgSVG, fetchBallSVG, butterflySVG } from './art.js';
import { sfx, voice, petVoice } from './audio.js';
import { state, load, save, activePet } from './save.js';

const game = document.getElementById('game');
let W = innerWidth, H = innerHeight;
addEventListener('resize', () => { W = innerWidth; H = innerHeight; });

const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const MAX_PETS = 4;
const ADOPT_PRICE = [0, 40, 70, 110];        // 第 n 只的价格

const ZONES = {
  home: { y0: 0.52, y1: 0.90, x0: 0.07, x1: 0.93 },
  park: { y0: 0.50, y1: 0.90, x0: 0.05, x1: 0.95 },
};
let scene = 'home';
const FLOOR = () => ZONES[scene];
const depthScale = (y) => { const z = FLOOR(); return 0.55 + 0.72 * (y - z.y0) / (z.y1 - z.y0); };

/* ---------------- 粒子 & 反馈 ---------------- */
const fxLayer = $('<div id="fx"></div>');
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

let heartPill;
function addHearts(n, x, y) {
  state.hearts += n; save();
  if (heartPill) {
    heartPill.querySelector('.hnum').textContent = state.hearts;
    heartPill.classList.remove('pulse'); void heartPill.offsetWidth;
    heartPill.classList.add('pulse');
  }
  sfx.coin();
  if (x !== undefined) particle(x, y, '💗', Math.min(n, 5));
}

/* ---------------- 小精灵 ---------------- */
let speechEl, speechTimer;
function elfSay(text, voiceName, dur = 4200) {
  if (!speechEl) return;
  speechEl.textContent = text;
  speechEl.classList.add('show');
  if (voiceName) voice(voiceName);
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => speechEl.classList.remove('show'), dur);
}

/* ---------------- 宠物实体 ---------------- */
class Pet {
  constructor(breed, name, opts = {}) {
    this.breed = breed; this.name = name;
    this.npc = !!opts.npc;
    this.idx = opts.idx ?? 0;
    this.cat = isCat(breed);
    this.x = 0.5; this.y = 0.78; this.tx = 0.5; this.ty = 0.78;
    this.mode = 'idle';
    this.el = $(`<div class="pet${this.npc ? ' npc' : ''}${this.cat ? ' iscat' : ''}"><div class="rig">
      <div class="vf"></div><div class="vs"></div>
    </div><div class="thought"></div><div class="zzz">💤</div></div>`);
    this.vf = this.el.querySelector('.vf');
    this.vs = this.el.querySelector('.vs');
    this.thought = this.el.querySelector('.thought');
    this.refreshArt(opts.equipped);
    this.speed = this.cat ? 0.0026 : 0.0022;
    this.nextThink = 0;
    this._strokeAcc = 0; this._lastStroke = null;
    this._buddyCd = 0;
    if (!this.npc) this.bindTouch();
    this._blinkT = setInterval(() => {
      if (this.mode !== 'sleep' && !this.el.classList.contains('happy')) {
        this.el.classList.add('blink');
        setTimeout(() => this.el.classList.remove('blink'), 160);
      }
    }, rand(2800, 4500));
  }
  get data() { return state.pets[this.idx]; }
  refreshArt(equipped) {
    this.equipped = equipped || (this.npc ? [] : (this.data ? this.data.equipped : []));
    this.vf.innerHTML = petSVG(this.breed, this.equipped);
    this.vs.innerHTML = petSideSVG(this.breed, this.equipped);
  }
  destroy() { clearInterval(this._blinkT); this.el.remove(); }
  bindTouch() {
    this.el.addEventListener('pointerdown', (e) => {
      if (state.active !== this.idx) { setActive(this.idx); }
      if (this.mode === 'sleep') return;
      this._lastStroke = { x: e.clientX, y: e.clientY };
      this.bounce(); this.bark();
    });
    this.el.addEventListener('pointermove', (e) => {
      if (this.mode === 'sleep') return;
      if (e.pointerType === 'mouse' && e.buttons === 0) return;
      if (!this._lastStroke) { this._lastStroke = { x: e.clientX, y: e.clientY }; return; }
      const dx = e.clientX - this._lastStroke.x, dy = e.clientY - this._lastStroke.y;
      this._strokeAcc += Math.hypot(dx, dy);
      this._lastStroke = { x: e.clientX, y: e.clientY };
      if (this._strokeAcc > 90) {
        this._strokeAcc = 0;
        if (groomMode && state.active === this.idx) { groomProgress(e.clientX, e.clientY); return; }
        this.happy(1800);
        particle(e.clientX, e.clientY, '💗');
        sfx.pop();
        if (this.cat && Math.random() < 0.4) sfx.purr();
        this._petStreak = (this._petStreak || 0) + 1;
        if (this._petStreak >= 5) {
          this._petStreak = 0;
          this.trick();
          addHearts(3);
          if (Math.random() < 0.5) elfSay(this.cat ? '它舒服得直打呼噜～' : '它开心得转圈圈啦！', 'play');
        } else {
          if (Math.random() < 0.15) this.bark();
          if (Math.random() < 0.1) elfSay('它喜欢你摸摸它呢～', 'stroke1');
          if (Math.random() < 0.25) addHearts(1);
        }
      }
    });
    this.el.addEventListener('pointerup', () => { this._lastStroke = null; });
  }
  trick() {
    const anim = Math.random() < 0.5 ? 'jump' : 'roll';
    this.el.classList.remove('jump', 'roll'); void this.el.offsetWidth;
    this.el.classList.add(anim);
    setTimeout(() => this.el.classList.remove(anim), 900);
    this.bark(); sfx.sparkle();
    particle(this.x * W, (this.y - 0.22) * H, '💖', 4);
  }
  bark() {
    if (this.npc) return;
    if (this.cat) petVoice(Math.random() < 0.5 ? 'meow' : 'meow2');
    else petVoice(Math.random() < 0.5 ? 'bark' : 'bark2');
  }
  bounce() { this.el.classList.remove('bounce'); void this.el.offsetWidth; this.el.classList.add('bounce'); }
  happy(ms = 2000) {
    this.el.classList.add('happy');
    clearTimeout(this._happyT);
    this._happyT = setTimeout(() => this.el.classList.remove('happy'), ms);
  }
  showThought(emoji, ms = 3000) {
    this.thought.textContent = emoji;
    this.thought.classList.add('show');
    clearTimeout(this._thoughtT);
    this._thoughtT = setTimeout(() => this.thought.classList.remove('show'), ms);
  }
  goto(x, y, then) {
    const z = FLOOR();
    this.tx = clamp(x, z.x0, z.x1); this.ty = clamp(y, z.y0, z.y1);
    this.mode = 'walk'; this._arrive = then;
    this.el.classList.add('walking', 'sideview');
    this.el.classList.toggle('face-left', this.tx < this.x);
  }
  setMode(m) {
    this.mode = m;
    this.el.classList.remove('walking', 'eating', 'sleeping', 'sideview');
    if (m === 'eat') this.el.classList.add('eating');
    if (m === 'sleep') this.el.classList.add('sleeping');
  }
  tick(dt, now) {
    if (this.mode === 'walk') {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      const step = this.speed * dt / 16;
      if (d < step * 1.5) {
        this.x = this.tx; this.y = this.ty;
        this.setMode('idle');
        const f = this._arrive; this._arrive = null;
        if (f) f();
      } else {
        this.x += dx / d * step; this.y += dy / d * step * 0.7;
      }
    } else if (this.mode === 'idle' && now > this.nextThink && !nightOn && !bathOpen && !groomMode) {
      this.nextThink = now + rand(3500, 8000);
      this.autonomy();
    }
    const s = depthScale(this.y);
    this.el.style.transform = `translate3d(${this.x * W}px, ${this.y * H}px, 0) scale(${s})`;
    this.el.style.zIndex = Math.round(this.y * 1000);
  }
  autonomy() {
    const z = FLOOR();
    if (this.npc || scene === 'park') {
      if (Math.random() < 0.75) this.goto(rand(z.x0 + 0.05, z.x1 - 0.05), rand(z.y0 + 0.04, z.y1 - 0.02));
      else this.happy(1500);
      return;
    }
    const toys = FURNI.filter(f => f.use === 'play' && state.decor[f.id]);
    const r = Math.random();
    // 有伙伴时，偶尔主动凑过去玩
    const buddies = pets.filter(p => p !== this && p.mode === 'idle');
    if (buddies.length && r < 0.28) {
      const bd = pick(buddies);
      this.goto(bd.x + (this.x < bd.x ? -0.07 : 0.07), bd.y + rand(-0.02, 0.02));
      return;
    }
    if (toys.length && r < 0.5) {
      const t = pick(toys), pos = state.decor[t.id];
      this.goto(pos.x + 0.02, pos.y + 0.015, () => {
        this.happy(2600); this.bounce(); this.bark();
        wiggleFurni(t.id);
        particle(this.x * W, (this.y - 0.18) * H, pick(['🎵', '✨', '💛']), 2);
        if (Math.random() < 0.5) addHearts(1);
        if (Math.random() < 0.2) elfSay('看！它玩得多开心呀！', 'play');
      });
    } else if (state.decor.cushion && r < 0.62) {
      const pos = state.decor.cushion;
      this.goto(pos.x, pos.y - 0.005, () => this.happy(3000));
    } else if (r < 0.88) {
      this.goto(rand(z.x0 + 0.05, z.x1 - 0.05), rand(z.y0 + 0.03, z.y1 - 0.02));
    } else {
      this.happy(1500);
    }
  }
}

let pets = [], friend = null;
const APet = () => pets[state.active] || pets[0];
let nightOn = false, bathOpen = false, groomMode = false;

/* ---------------- 家具 ---------------- */
const furniEls = {};
function svgAspect(svg) {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  return m ? +m[2] / +m[1] : 1;
}
function wiggleFurni(id) {
  const el = furniEls[id];
  if (!el) return;
  const rig = el.querySelector('.rig');
  rig.style.animation = 'none'; void rig.offsetWidth;
  rig.style.animation = 'shake .55s ease';
  setTimeout(() => rig.style.animation = '', 600);
}
function spawnFurni(f, world) {
  const pos = state.decor[f.id];
  const el = $(`<div class="furni" data-id="${f.id}"><div class="rig">${f.svg}</div></div>`);
  const hvmin = f.w * svgAspect(f.svg);
  el.style.width = f.w + 'vmin';
  el.style.height = hvmin + 'vmin';
  el.style.marginLeft = (-f.w / 2) + 'vmin';
  el.style.marginTop = (-hvmin * 0.9) + 'vmin';
  el.style.touchAction = 'none';
  furniEls[f.id] = el;
  placeFurni(f, el, pos.x, pos.y);
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    drag = { id: e.pointerId };
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    sfx.pip();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const z = ZONES.home;
    const x = clamp(e.clientX / W, 0.05, 0.95);
    const y = f.zone === 'wall' ? clamp(e.clientY / H, 0.14, 0.42) : clamp(e.clientY / H, z.y0, z.y1);
    placeFurni(f, el, x, y);
  });
  const drop = () => {
    if (!drag) return;
    drag = null;
    el.classList.remove('dragging');
    sfx.pop();
    save();
  };
  el.addEventListener('pointerup', drop);
  el.addEventListener('pointercancel', drop);
  world.appendChild(el);
}
function placeFurni(f, el, x, y) {
  state.decor[f.id] = { x, y };
  const s = f.zone === 'wall' ? 1 : depthScale(y);
  el.style.transform = `translate3d(${x * W}px, ${y * H}px, 0) scale(${s})`;
  el.style.zIndex = f.zone === 'wall' ? 5 : Math.round(y * 1000);
}

/* ---------------- 场景 ---------------- */
let bowlEl, worldEl;
function clearScene() {
  for (const k in furniEls) delete furniEls[k];
  if (friend) { friend.destroy(); friend = null; }
  stopParkLife();
  game.querySelectorAll('#room-bg,#world,#night,#hud,#elf,#speech,#toolbar,.tray,#shop,#bath,#wardrobe,#adopt-house').forEach(n => n.remove());
}

function spawnPets(startSpots) {
  pets.forEach(p => p.destroy());
  pets = state.pets.map((d, i) => {
    const p = new Pet(d.breed, d.name, { idx: i });
    const sp = startSpots[i] || [rand(0.35, 0.75), rand(0.62, 0.8)];
    p.x = p.tx = sp[0]; p.y = p.ty = sp[1];
    worldEl.appendChild(p.el);
    return p;
  });
}

function buildHome(entering) {
  scene = 'home';
  clearScene();
  game.insertAdjacentHTML('afterbegin', roomBgSVG());
  worldEl = $('<div id="world"></div>');
  game.insertBefore(worldEl, fxLayer.parentNode === game ? fxLayer : null);

  bowlEl = $(`<div class="furni" id="bowl">${bowlSVG('food')}</div>`);
  bowlEl.style.cssText = 'width:13vmin;height:7.6vmin;margin-left:-6.5vmin;margin-top:-6.8vmin';
  placeFixed(bowlEl, 0.14, 0.62);
  const waterEl = $(`<div class="furni">${bowlSVG('water')}</div>`);
  waterEl.style.cssText = 'width:12vmin;height:7vmin;margin-left:-6vmin;margin-top:-6.3vmin';
  placeFixed(waterEl, 0.23, 0.65);
  waterEl.addEventListener('pointerdown', () => { sfx.bubble(); particle(0.23 * W, 0.58 * H, '💧'); });
  worldEl.appendChild(bowlEl); worldEl.appendChild(waterEl);

  for (const f of FURNI) if (state.decor[f.id]) spawnFurni(f, worldEl);

  const spots = entering === 'fromPark'
    ? state.pets.map((_, i) => [0.82 - i * 0.1, 0.6 + i * 0.05])
    : state.pets.map((_, i) => [0.36 + i * 0.15, 0.66 + (i % 2) * 0.09]);
  spawnPets(spots);

  if (!fxLayer.parentNode) game.appendChild(fxLayer);

  const night = $('<div id="night"></div>');
  for (let i = 0; i < 14; i++) {
    const st = $('<div class="star">✦</div>');
    st.style.left = rand(3, 94) + '%'; st.style.top = rand(3, 55) + '%';
    st.style.fontSize = rand(1.5, 3.2) + 'vmin';
    st.style.animationDelay = rand(0, 2) + 's';
    night.appendChild(st);
  }
  game.appendChild(night);

  buildUI('home');
  const door = game.querySelector('#door-park');
  if (door) door.addEventListener('pointerdown', goPark);
}

function buildPark() {
  scene = 'park';
  clearScene();
  game.insertAdjacentHTML('afterbegin', parkBgSVG());
  worldEl = $('<div id="world"></div>');
  game.insertBefore(worldEl, fxLayer.parentNode === game ? fxLayer : null);

  // 全家一起出门
  spawnPets(state.pets.map((_, i) => [0.42 + i * 0.14, 0.68 + (i % 2) * 0.08]));
  pets.forEach(p => p.setMode('idle'));

  const others = Object.keys(BREEDS).filter(k => !state.pets.some(p => p.breed === k));
  const fb = pick(others.length ? others : Object.keys(BREEDS));
  friend = new Pet(fb, BREEDS[fb].label, { npc: true, equipped: [pick(['bow', 'strawhat', 'partyhat', 'flower'])] });
  friend.x = friend.tx = rand(0.1, 0.2); friend.y = friend.ty = rand(0.55, 0.66);
  friend.el.appendChild($(`<div class="nametag">${BREEDS[fb].label}</div>`));
  worldEl.appendChild(friend.el);

  if (!fxLayer.parentNode) game.appendChild(fxLayer);
  buildUI('park');
  startParkLife();
  elfSay('哇，公园到啦！扔小球给它们捡吧，还有蝴蝶可以追！', 'park_go', 5500);
}

function goPark() {
  if (nightOn || bathOpen || groomMode) return;
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

function placeFixed(el, x, y) {
  el.style.transform = `translate3d(${x * W}px, ${y * H}px, 0) scale(${depthScale(y)})`;
  el.style.zIndex = Math.round(y * 1000);
}

/* ---------------- UI ---------------- */
let chipsEl;
function buildUI(kind) {
  const hud = $(`<div id="hud">
    <div id="heart-pill"><span class="hicon">💗</span><span class="hnum">${state.hearts}</span></div>
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

  const elf = $(`<div id="elf">${elfSVG()}</div>`);
  elf.addEventListener('pointerdown', () => {
    sfx.sparkle();
    elfSay(pick(scene === 'park' ? [
      '扔小球，它们会飞快地捡回来哦！',
      '轻轻点一下蝴蝶试试～',
      '带它们认识新朋友吧！',
    ] : [
      `多陪陪${activePet().name}，爱心就会越来越多哦！`,
      '木门那边就是公园，可以出去遛弯～',
      '爱心够了，可以再领养一只小猫或小狗呀！',
      '点上面的小头像，就能换一只来照顾啦！',
    ]), pick(['elf1', 'elf2']));
  });
  game.appendChild(elf);
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
    ({ feed: openTray, bath: openBath, groom: startGroom, sleep: toggleNight, dress: openWardrobe,
       adopt: openAdoptHouse, shop: openShop, park: goPark, home: goHome,
       throw: throwBall, bubble: blowBubbles })[b.dataset.act]();
  });
  game.appendChild(bar);

  if (kind === 'home') { buildTray(); buildShop(); buildBath(); buildWardrobe(); buildAdoptHouse(); }
}

function refreshChips() {
  if (!chipsEl) return;
  let html = '';
  state.pets.forEach((p, i) => {
    html += `<div class="chip${i === state.active ? ' on' : ''}" data-i="${i}">
      <div class="chip-art">${petSVG(p.breed, p.equipped)}</div></div>`;
  });
  if (state.pets.length < MAX_PETS && scene === 'home') html += `<div class="chip add" data-add>＋</div>`;
  chipsEl.innerHTML = html;
}
function setActive(i) {
  if (i === state.active) return;
  state.active = i; save();
  refreshChips();
  sfx.pip();
  const p = pets[i];
  if (p) { p.bounce(); p.happy(1500); p.showThought('💗', 1500); }
}

/* ---------------- 吃饭（全家一起）---------------- */
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
  const bx = 0.14 * W, by = 0.56 * H;
  const fly = $(`<div class="pfx" style="animation:none;font-size:7vmin">${emoji}</div>`);
  fly.style.left = fromX + 'px'; fly.style.top = fromY + 'px';
  fly.style.transition = 'all .55s cubic-bezier(.4,0,.6,1)';
  fxLayer.appendChild(fly);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fly.style.left = bx + 'px'; fly.style.top = by + 'px';
    fly.style.transform = 'scale(.6)';
  }));
  sfx.pop();
  setTimeout(() => {
    fly.remove();
    bowlEl.querySelector('.kibble').setAttribute('opacity', '1');
    let done = 0;
    pets.forEach((p, i) => {
      p.goto(0.21 + i * 0.075, 0.64 + (i % 2) * 0.035, () => {
        p.el.classList.add('face-left');
        p.setMode('eat');
        let n = 0;
        const munchT = setInterval(() => {
          sfx.munch();
          particle((0.155 + i * 0.06) * W, 0.57 * H, pick(['✦', '·']), 1);
          if (++n >= 5) {
            clearInterval(munchT);
            p.setMode('idle');
            p.happy(3000); p.bounce(); p.bark();
            p.showThought('😋');
            if (++done === pets.length) {
              bowlEl.querySelector('.kibble').setAttribute('opacity', '0');
              state.stats.hunger = 100; save();
              addHearts(5 * pets.length, 0.2 * W, 0.5 * H);
              elfSay(pets.length > 1 ? '大家都吃饱啦，肚子圆滚滚！' : '吃得真香呀～肚子圆滚滚！', 'feed_done');
            }
          }
        }, 550);
      });
    });
  }, 600);
}

/* ---------------- 洗澡 ---------------- */
let bathEl, bathScrub = 0;
function buildBath() {
  bathEl = $(`<div id="bath"><div id="bath-stage">
    <div id="bath-meter"><span class="st">✨</span><span class="st">✨</span><span class="st">✨</span></div>
    ${tubSVG()}</div></div>`);
  const stage = bathEl.querySelector('#bath-stage');
  let last = null, throttle = 0;
  stage.addEventListener('pointermove', (e) => {
    if (!bathOpen) return;
    if (last) {
      bathScrub += Math.hypot(e.clientX - last.x, e.clientY - last.y);
      const now = performance.now();
      if (now - throttle > 90) {
        throttle = now;
        const b = $('<div class="bubble"></div>');
        const r = stage.getBoundingClientRect();
        b.style.left = (e.clientX - r.left - 10) + 'px';
        b.style.top = (e.clientY - r.top - 10) + 'px';
        const size = rand(2.5, 6);
        b.style.width = size + 'vmin'; b.style.height = size + 'vmin';
        stage.appendChild(b);
        setTimeout(() => b.remove(), 1400);
        sfx.bubble();
      }
      const stars = bathEl.querySelectorAll('.st');
      const lit = Math.min(3, Math.floor(bathScrub / 900));
      stars.forEach((s, i) => s.classList.toggle('lit', i < lit));
      bathEl.querySelector('#bath-meter').classList.add('any');
      if (lit >= 3) finishBath();
    }
    last = { x: e.clientX, y: e.clientY };
  });
  stage.addEventListener('pointerleave', () => last = null);
  game.appendChild(bathEl);
}
function openBath() {
  if (nightOn || bathOpen) return;
  bathOpen = true; bathScrub = 0;
  const ap = activePet();
  const stage = bathEl.querySelector('#bath-stage');
  stage.querySelectorAll('.pet').forEach(p => p.remove());
  stage.querySelectorAll('.st').forEach(s => s.classList.remove('lit'));
  const p = $(`<div class="pet happy"><div class="rig">${petSVG(ap.breed, ap.equipped)}</div></div>`);
  stage.insertBefore(p, stage.querySelector('svg.tub'));
  APet().el.style.opacity = '0';
  bathEl.classList.add('show');
  sfx.splash();
  elfSay(`哗啦啦～给${ap.name}搓出好多泡泡吧！`, 'bath_start', 5000);
}
function finishBath() {
  if (!bathOpen) return;
  bathOpen = false;
  const p = APet();
  sfx.splash(); sfx.sparkle();
  setTimeout(() => {
    bathEl.classList.remove('show');
    p.el.style.opacity = '1';
    p.el.classList.add('shake');
    setTimeout(() => p.el.classList.remove('shake'), 600);
    state.stats.clean = 100; save();
    p.happy(3000); p.bark(); p.showThought('✨');
    addHearts(8, p.x * W, (p.y - 0.2) * H);
    elfSay('哇，香喷喷亮晶晶！', 'bath_done');
  }, 900);
}

/* ---------------- 梳毛 ---------------- */
let groomCount = 0;
function startGroom() {
  if (nightOn || bathOpen || groomMode) return;
  groomMode = true; groomCount = 0;
  const p = APet();
  p.setMode('idle'); p.tx = p.x; p.ty = p.y;
  elfSay(`在${activePet().name}身上轻轻划一划，做个美容～`, 'brush_start', 5000);
}
function groomProgress(x, y) {
  groomCount++;
  sfx.brush();
  particle(x, y, pick(['✨', '🫧']));
  APet().happy(1500);
  if (groomCount >= 10) {
    groomMode = false;
    sfx.sparkle();
    const p = APet();
    p.bounce(); p.bark(); p.showThought('💖');
    addHearts(5, x, y);
    elfSay('毛毛梳得顺顺的，真漂亮！', 'brush_done');
  }
}

/* ---------------- 睡觉 ---------------- */
let nightTimer;
function toggleNight() {
  if (bathOpen) return;
  if (!nightOn) {
    nightOn = true;
    game.classList.add('is-night');
    document.getElementById('night').classList.add('on');
    trayEl.classList.remove('show');
    ['shop', 'wardrobe', 'adopt-house'].forEach(id => document.getElementById(id)?.classList.remove('show'));
    const bedPos = state.decor.bed;
    pets.forEach((p, i) => {
      const go = bedPos ? [bedPos.x + (i - (pets.length - 1) / 2) * 0.07, bedPos.y - 0.022]
                        : [0.44 + i * 0.09, 0.78];
      p.goto(go[0], go[1], () => p.setMode('sleep'));
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
  game.classList.remove('is-night');
  document.getElementById('night').classList.remove('on');
  pets.forEach(p => { p.setMode('idle'); p.bounce(); p.happy(3000); });
  APet().bark();
  state.stats.energy = 100; save();
  sfx.chime();
  addHearts(3 * pets.length, APet().x * W, (APet().y - 0.2) * H);
  elfSay('早上好呀！睡饱饱，精神好！', 'wake');
}

/* ---------------- 商店 ---------------- */
function buildShop() {
  const shop = $(`<div id="shop" class="drawer"><h3>温暖小家具 <button class="btn dclose">✕</button></h3><div class="dlist"></div></div>`);
  const list = shop.querySelector('.dlist');
  for (const f of FURNI) {
    const item = $(`<div class="shop-item" data-id="${f.id}">
      <div class="thumb">${f.svg}</div>
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
  heartPill.querySelector('.hnum').textContent = state.hearts;
  state.decor[f.id] = f.zone === 'wall' ? { x: 0.55, y: 0.28 } : { x: rand(0.35, 0.7), y: rand(0.6, 0.85) };
  save();
  spawnFurni(f, worldEl);
  refreshShop();
  sfx.ding(); sfx.sparkle();
  document.getElementById('shop').classList.remove('show');
  const pos = state.decor[f.id];
  particle(pos.x * W, pos.y * H - 40, '✨', 4);
  elfSay('放这里真不错！按住它还可以挪位置哦～', 'placed', 5000);
  if (f.use === 'play') setTimeout(() => APet().autonomy(), 1200);
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
    heartPill.querySelector('.hnum').textContent = state.hearts;
    state.wardrobe.owned[c.id] = true;
    sfx.ding();
  }
  const i = d.equipped.indexOf(c.id);
  if (i >= 0) { d.equipped.splice(i, 1); sfx.pip(); }
  else {
    d.equipped = d.equipped.filter(id => (CLOTHES.find(x => x.id === id) || {}).slot !== c.slot);
    d.equipped.push(c.id);
    sfx.sparkle();
    APet().trick();
    elfSay(`哇，${d.name}穿上${c.name}真好看！`, 'dress_on');
  }
  save();
  APet().refreshArt(d.equipped);
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
      <div class="thumb ah-thumb">${petSVG(key)}</div>
      <div class="info"><div class="name">${b.label}</div>
      <div class="price">${b.kind === 'cat' ? '🐱 小猫' : '🐶 小狗'} · 💗 ${price}</div></div>
    </div>`);
    item.addEventListener('pointerdown', () => adoptNew(key, price));
    list.appendChild(item);
  }
}
function openAdoptHouse() {
  if (nightOn || bathOpen || scene !== 'home') return;
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
  heartPill.querySelector('.hnum').textContent = state.hearts;
  const used = state.pets.map(p => p.name);
  const name = NEW_NAMES.find(n => !used.includes(n)) || '小可爱';
  state.pets.push({ breed, name, equipped: [] });
  state.active = state.pets.length - 1;
  save();

  const p = new Pet(breed, name, { idx: state.pets.length - 1 });
  p.x = p.tx = 0.86; p.y = p.ty = 0.6;              // 从门口进来
  worldEl.appendChild(p.el);
  pets.push(p);
  p.goto(rand(0.45, 0.65), rand(0.68, 0.8), () => { p.trick(); p.happy(3000); });

  refreshChips();
  refreshAdoptHouse();
  document.getElementById('adopt-house').classList.remove('show');
  sfx.ding(); sfx.sparkle();
  voice('adopt_new');
  elfSay(`欢迎${name}回家！现在有 ${state.pets.length} 个小伙伴啦～`, null, 5200);
}

/* ---------------- 宠物之间互动 ---------------- */
setInterval(() => {
  if (scene !== 'home' || nightOn || bathOpen || pets.length < 2) return;
  const now = Date.now();
  for (let i = 0; i < pets.length; i++) {
    for (let j = i + 1; j < pets.length; j++) {
      const a = pets[i], b = pets[j];
      if (a.mode !== 'idle' || b.mode !== 'idle') continue;
      if (now < a._buddyCd || now < b._buddyCd) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < 0.1) {
        a._buddyCd = b._buddyCd = now + 15000;
        a.trick(); b.happy(2600); b.bounce();
        particle(((a.x + b.x) / 2) * W, (Math.min(a.y, b.y) - 0.2) * H, pick(['💞', '🎵', '✨']), 3);
        addHearts(2);
        if (Math.random() < 0.45) elfSay(`${a.name}和${b.name}玩到一起啦！`, 'buddies');
        return;
      }
    }
  }
}, 1500);

/* ---------------- 公园 ---------------- */
let parkTimers = [], ballBusy = false, friendCooldown = 0;
function startParkLife() {
  for (let i = 0; i < 3; i++) spawnButterfly(i);
  parkTimers.push(setInterval(() => {
    if (!friend || scene !== 'park') return;
    for (const p of pets) {
      if (Math.hypot(p.x - friend.x, p.y - friend.y) < 0.09 && Date.now() > friendCooldown) {
        friendCooldown = Date.now() + 12000;
        p.trick();
        friend.el.classList.add('jump');
        setTimeout(() => friend.el.classList.remove('jump'), 900);
        addHearts(4, ((p.x + friend.x) / 2) * W, (p.y - 0.2) * H);
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
  game.querySelectorAll('.butterfly,.fetch-ball,.pbubble').forEach(n => n.remove());
}
function spawnButterfly(i) {
  const bf = $(`<div class="butterfly">${butterflySVG(pick(['#f2a0c4', '#a8d8f0', '#ffd766']))}</div>`);
  let bx = rand(0.15, 0.85), by = rand(0.3, 0.55), t = rand(0, 99);
  game.appendChild(bf);
  const mv = setInterval(() => {
    if (scene !== 'park') return;
    t += 0.04;
    bx = clamp(bx + Math.sin(t * 0.7 + i * 2) * 0.004, 0.06, 0.94);
    by = clamp(by + Math.cos(t * 1.1 + i) * 0.003, 0.2, 0.62);
    bf.style.transform = `translate3d(${bx * W}px, ${by * H}px, 0)`;
  }, 40);
  parkTimers.push(mv);
  bf.addEventListener('pointerdown', () => {
    sfx.sparkle();
    particle(bx * W, by * H, '✨', 3);
    bf.classList.add('flee');
    const chaser = APet();
    chaser.goto(clamp(bx, 0.1, 0.9), clamp(by + 0.25, FLOOR().y0, FLOOR().y1), () => {
      chaser.trick();
      addHearts(2, chaser.x * W, (chaser.y - 0.2) * H);
      if (Math.random() < 0.5) elfSay('追到蝴蝶啦，好厉害！', 'park_butterfly');
    });
    setTimeout(() => { bf.classList.remove('flee'); bx = rand(0.1, 0.9); by = rand(0.25, 0.5); }, 2000);
  });
}
function throwBall() {
  if (ballBusy || !pets.length) return;
  ballBusy = true;
  sfx.pop(); voice('park_ball');
  const sx = 0.5, sy = 0.95;
  const txx = rand(0.2, 0.8), tyy = rand(FLOOR().y0 + 0.06, FLOOR().y1 - 0.04);
  const ball = $(`<div class="fetch-ball">${fetchBallSVG()}</div>`);
  game.appendChild(ball);
  const runner = APet();
  const t0 = performance.now(), dur = 900;
  const arc = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const x = sx + (txx - sx) * p;
    const y = sy + (tyy - sy) * p - Math.sin(p * Math.PI) * 0.3;
    ball.style.transform = `translate3d(${x * W}px, ${y * H}px, 0) rotate(${p * 720}deg)`;
    if (p < 1) requestAnimationFrame(arc);
    else {
      sfx.boing();
      particle(txx * W, tyy * H, '💨', 2);
      runner.goto(txx, tyy, () => {
        ball.remove();
        runner.showThought('🥎');
        sfx.pip(); runner.bark();
        runner.goto(rand(0.4, 0.6), rand(0.7, 0.85), () => {
          runner.trick();
          addHearts(3, runner.x * W, (runner.y - 0.2) * H);
          elfSay(pick(['捡回来啦！再扔一次？', `${runner.name}跑得好快呀！`]), 'park_fetch');
          ballBusy = false;
        });
      });
    }
  };
  requestAnimationFrame(arc);
}
function blowBubbles() {
  sfx.bubble();
  for (let i = 0; i < 6; i++) {
    const b = $('<div class="pbubble"></div>');
    const size = rand(3, 7);
    b.style.width = size + 'vmin'; b.style.height = size + 'vmin';
    b.style.left = rand(0.2, 0.8) * W + 'px';
    b.style.top = rand(0.5, 0.8) * H + 'px';
    b.style.animationDelay = (i * 0.15) + 's';
    b.addEventListener('pointerdown', () => {
      sfx.bubble(); particle(parseFloat(b.style.left), parseFloat(b.style.top), '💧', 2);
      b.remove();
      if (Math.random() < 0.4) addHearts(1);
    });
    game.appendChild(b);
    setTimeout(() => b.remove(), 4200);
  }
  pets.forEach(p => { if (p.mode === 'idle') p.happy(2500); });
}

/* ---------------- 状态衰减 ---------------- */
setInterval(() => {
  if (!pets.length || nightOn) return;
  state.stats.hunger = Math.max(0, state.stats.hunger - 0.5);
  state.stats.clean = Math.max(0, state.stats.clean - 0.35);
  save();
  if (scene !== 'home') return;
  if (state.stats.hunger < 42 && Math.random() < 0.5) {
    pick(pets).showThought('🍖');
    if (Math.random() < 0.4) elfSay('咕噜咕噜～小肚子在叫啦，我们喂点好吃的吧！', 'hungry');
  } else if (state.stats.clean < 40 && Math.random() < 0.4) {
    pick(pets).showThought('🛁');
    if (Math.random() < 0.4) elfSay('身上有点脏脏啦，洗个泡泡澡吧！', 'dirty');
  }
}, 12000);

/* ---------------- 主循环 ---------------- */
let lastT = 0;
/* 个人空间：靠太近就互相轻推开，避免叠在一起看不清 */
const MIN_GAP = 0.085;
function separate() {
  const all = friend ? pets.concat(friend) : pets;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      if (a.mode === 'sleep' || b.mode === 'sleep' || a.mode === 'eat' || b.mode === 'eat') continue;
      let dx = b.x - a.x, dy = (b.y - a.y) * 1.6;
      let d = Math.hypot(dx, dy);
      if (d >= MIN_GAP) continue;
      if (d < 1e-4) { dx = 0.01; dy = 0; d = 0.01; }
      const push = (MIN_GAP - d) * 0.22;
      const z = FLOOR();
      a.x = clamp(a.x - dx / d * push, z.x0, z.x1);
      b.x = clamp(b.x + dx / d * push, z.x0, z.x1);
      a.y = clamp(a.y - dy / d * push * 0.5, z.y0, z.y1);
      b.y = clamp(b.y + dy / d * push * 0.5, z.y0, z.y1);
    }
  }
}
function startLoop() {
  const loop = (t) => {
    const dt = Math.min(t - lastT, 50); lastT = t;
    try {
      for (const p of pets) p.tick(dt, t);
      if (friend) friend.tick(dt, t);
      if (pets.length > 1 || friend) separate();
    } catch (e) { console.error('tick error', e); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------------- 首次领养 ---------------- */
function buildAdopt() {
  const names = ['布丁', '豆豆', '可乐', '糯米', '雪球', '毛毛'];
  const sc = $(`<div id="adopt">
    <h1>🐾 欢迎来到宠物小窝</h1>
    <div class="sub">小猫小狗都想跟你回家，摸摸它们，先选一只吧！</div>
    <div id="baskets"></div>
    <div id="name-panel"><h2>给它取个好听的名字吧</h2><div id="name-grid">
      ${names.map(n => `<button class="btn">${n}</button>`).join('')}
    </div></div>
  </div>`);
  const baskets = sc.querySelector('#baskets');
  let chosen = null;
  for (const key of Object.keys(BREEDS)) {
    const b = $(`<div class="basket" data-b="${key}">
      <div class="pit"><div class="bart">${FURNI[0].svg}</div><div class="pet"><div class="rig"><div class="vf">${petSVG(key)}</div></div></div></div>
      <div class="bname">${BREEDS[key].label}</div>
    </div>`);
    b.addEventListener('pointerdown', () => {
      sfx.unlock(); sfx.pop();
      petVoice(isCat(key) ? 'meow' : 'bark');
      chosen = key;
      baskets.querySelectorAll('.basket').forEach(x => {
        x.classList.toggle('picked', x === b);
        x.classList.toggle('dim', x !== b);
      });
      const pv = b.querySelector('.pet');
      pv.classList.add('happy');
      pv.classList.remove('bounce'); void pv.offsetWidth; pv.classList.add('bounce');
      setTimeout(() => { if (chosen === key) sc.querySelector('#name-panel').classList.add('show'); }, 900);
    });
    baskets.appendChild(b);
  }
  sc.querySelector('#name-grid').addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || !chosen) return;
    sfx.ding(); sfx.sparkle();
    voice('adopt_done');
    state.pets = [{ breed: chosen, name: btn.textContent, equipped: [] }];
    state.active = 0;
    save();
    sc.classList.add('gone');
    setTimeout(() => {
      sc.remove();
      buildHome();
      setTimeout(() => elfSay(`这就是你们温暖的小家～摸摸${activePet().name}，它会很开心哦！`, 'home_first', 6000), 800);
    }, 650);
  });
  game.appendChild(sc);
  setTimeout(() => voice('welcome'), 600);
}

/* ---------------- 启动 ---------------- */
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
const hasSave = load();
document.getElementById('boot').classList.add('gone');
setTimeout(() => { const b = document.getElementById('boot'); if (b) b.remove(); }, 700);
if (hasSave) {
  buildHome();
  setTimeout(() => {
    elfSay(`欢迎回来！${activePet().name}好想你呀～`, null, 4000);
    const p = APet();
    p.el.classList.add('jump'); p.bark();
    setTimeout(() => p.el.classList.remove('jump'), 900);
  }, 900);
} else {
  buildAdopt();
}
startLoop();

/* 调试直达 */
const dbg = new URLSearchParams(location.search).get('auto');
if (dbg && hasSave) setTimeout(() => {
  ({ night: toggleNight, bath: openBath, shop: openShop, feed: openTray,
     park: goPark, dress: openWardrobe, adopt: openAdoptHouse })[dbg]?.();
}, 1500);
