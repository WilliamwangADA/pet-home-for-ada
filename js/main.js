/* ============ Ada的宠物小窝 · 主逻辑 v0.2（2.5D + 公园 + 换装）============ */
import { BREEDS, petSVG, petSideSVG, elfSVG, tubSVG, bowlSVG, FURNI, CLOTHES,
         roomBgSVG, parkBgSVG, fetchBallSVG, butterflySVG } from './art.js';
import { sfx, voice, petVoice } from './audio.js';
import { state, load, save } from './save.js';

const game = document.getElementById('game');
let W = innerWidth, H = innerHeight;
addEventListener('resize', () => { W = innerWidth; H = innerHeight; });

const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* 场景地面活动区（屏幕比例） */
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
    this.x = 0.5; this.y = 0.78; this.tx = 0.5; this.ty = 0.78;
    this.mode = 'idle';
    this.el = $(`<div class="pet${this.npc ? ' npc' : ''}"><div class="rig">
      <div class="vf"></div><div class="vs"></div>
    </div><div class="thought"></div><div class="zzz">💤</div></div>`);
    this.vf = this.el.querySelector('.vf');
    this.vs = this.el.querySelector('.vs');
    this.thought = this.el.querySelector('.thought');
    this.refreshArt(opts.equipped);
    this.speed = 0.0022;
    this.nextThink = 0;
    this._strokeAcc = 0; this._lastStroke = null;
    if (!this.npc) this.bindTouch();
    this._blinkT = setInterval(() => {
      if (this.mode !== 'sleep' && !this.el.classList.contains('happy')) {
        this.el.classList.add('blink');
        setTimeout(() => this.el.classList.remove('blink'), 160);
      }
    }, rand(2800, 4500));
  }
  refreshArt(equipped) {
    this.equipped = equipped || (this.npc ? [] : state.wardrobe.equipped);
    this.vf.innerHTML = petSVG(this.breed, this.equipped);
    this.vs.innerHTML = petSideSVG(this.breed, this.equipped);
  }
  destroy() { clearInterval(this._blinkT); this.el.remove(); }
  bindTouch() {
    this.el.addEventListener('pointerdown', (e) => {
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
        if (groomMode) { groomProgress(e.clientX, e.clientY); return; }
        this.happy(1800);
        particle(e.clientX, e.clientY, '💗');
        sfx.pop();
        this._petStreak = (this._petStreak || 0) + 1;
        if (this._petStreak >= 5) {
          this._petStreak = 0;
          this.trick();
          addHearts(3);
          if (Math.random() < 0.5) elfSay('它开心得转圈圈啦！', 'play');
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
  bark() { if (!this.npc) petVoice(Math.random() < 0.5 ? 'bark' : 'bark2'); }
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
    if (toys.length && r < 0.35) {
      const t = pick(toys), pos = state.decor[t.id];
      this.goto(pos.x + 0.02, pos.y + 0.015, () => {
        this.happy(2600); this.bounce(); this.bark();
        wiggleFurni(t.id);
        particle(this.x * W, (this.y - 0.18) * H, pick(['🎵', '✨', '💛']), 2);
        if (Math.random() < 0.5) addHearts(1);
        if (Math.random() < 0.2) elfSay('看！它玩得多开心呀！', 'play');
      });
    } else if (state.decor.cushion && r < 0.5) {
      const pos = state.decor.cushion;
      this.goto(pos.x, pos.y - 0.005, () => this.happy(3000));
    } else if (r < 0.8) {
      this.goto(rand(z.x0 + 0.05, z.x1 - 0.05), rand(z.y0 + 0.03, z.y1 - 0.02));
    } else {
      this.happy(1500);
    }
  }
}

let pet = null, friend = null;
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

/* ---------------- 场景搭建 ---------------- */
let bowlEl, worldEl;
function clearScene() {
  for (const k in furniEls) delete furniEls[k];
  if (friend) { friend.destroy(); friend = null; }
  stopParkLife();
  game.querySelectorAll('#room-bg,#world,#night,#hud,#elf,#speech,#toolbar,.tray,#shop,#bath,#wardrobe').forEach(n => n.remove());
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

  if (!pet) {
    pet = new Pet(state.pet.breed, state.pet.name);
    pet.x = pet.tx = 0.55; pet.y = pet.ty = 0.74;
  } else {
    pet.setMode('idle');
    pet.x = pet.tx = entering === 'fromPark' ? 0.78 : 0.55;
    pet.y = pet.ty = 0.66;
  }
  worldEl.appendChild(pet.el);

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
  // 公园门
  const door = game.querySelector('#door-park');
  if (door) door.addEventListener('pointerdown', goPark);
}

function buildPark() {
  scene = 'park';
  clearScene();
  game.insertAdjacentHTML('afterbegin', parkBgSVG());
  worldEl = $('<div id="world"></div>');
  game.insertBefore(worldEl, fxLayer.parentNode === game ? fxLayer : null);

  pet.setMode('idle');
  pet.x = pet.tx = 0.5; pet.y = pet.ty = 0.72;
  worldEl.appendChild(pet.el);

  // 朋友狗（随机非同品种 + 随机戴一件头饰）
  const others = Object.keys(BREEDS).filter(k => k !== pet.breed);
  const fb = pick(others);
  friend = new Pet(fb, BREEDS[fb].label, { npc: true, equipped: [pick(['bow', 'strawhat', 'partyhat', 'flower'])] });
  friend.x = friend.tx = rand(0.15, 0.3); friend.y = friend.ty = rand(0.6, 0.8);
  const tag = $(`<div class="nametag">${BREEDS[fb].label}</div>`);
  friend.el.appendChild(tag);
  worldEl.appendChild(friend.el);

  if (!fxLayer.parentNode) game.appendChild(fxLayer);
  buildUI('park');
  startParkLife();
  elfSay('哇，公园到啦！扔小球给它捡吧，还有蝴蝶可以追！', 'park_go', 5500);
}

function goPark() {
  if (nightOn || bathOpen || groomMode) return;
  sfx.chime();
  voice('park_out');
  transition(() => buildPark());
}
function goHome() {
  sfx.pip();
  transition(() => {
    buildHome('fromPark');
    elfSay('到家啦～玩得真开心！', 'park_home');
  });
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
function buildUI(kind) {
  const hud = $(`<div id="hud"><div id="heart-pill"><span class="hicon">💗</span><span class="hnum">${state.hearts}</span></div></div>`);
  game.appendChild(hud);
  heartPill = hud.querySelector('#heart-pill');

  const elf = $(`<div id="elf">${elfSVG()}</div>`);
  elf.addEventListener('pointerdown', () => {
    sfx.sparkle();
    elfSay(pick(scene === 'park' ? [
      '扔小球，它会飞快地捡回来哦！',
      '轻轻点一下蝴蝶试试～',
      `带${state.pet.name}认识新朋友吧！`,
    ] : [
      `多陪陪${state.pet.name}，爱心就会越来越多哦！`,
      '木门那边就是公园，可以出去遛弯～',
      '攒够爱心，去商店给它买漂亮衣服呀！',
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
        <button class="btn" data-act="shop"><span>🛒</span><i>商店</i></button>
      </div>`);
  bar.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (!b) return;
    sfx.pip();
    ({ feed: openTray, bath: openBath, groom: startGroom, sleep: toggleNight,
       dress: openWardrobe, shop: openShop, home: goHome, throw: throwBall, bubble: blowBubbles })[b.dataset.act]();
  });
  game.appendChild(bar);

  if (kind === 'home') { buildTray(); buildShop(); buildBath(); buildWardrobe(); }
}

/* ---------------- 吃饭 ---------------- */
let trayEl;
const FOODS = [['🦴', '大骨头'], ['🍖', '肉肉'], ['🥕', '胡萝卜'], ['🥛', '牛奶']];
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
    pet.goto(0.21, 0.64, () => {
      pet.el.classList.add('face-left');
      pet.setMode('eat');
      let n = 0;
      const munchT = setInterval(() => {
        sfx.munch();
        particle(0.155 * W, 0.57 * H, pick(['✦', '·']), 1);
        if (++n >= 5) {
          clearInterval(munchT);
          pet.setMode('idle');
          bowlEl.querySelector('.kibble').setAttribute('opacity', '0');
          state.stats.hunger = 100; save();
          pet.happy(3000); pet.bounce(); pet.bark();
          pet.showThought('😋');
          addHearts(5, 0.18 * W, 0.5 * H);
          elfSay('吃得真香呀～肚子圆滚滚！', 'feed_done');
        }
      }, 550);
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
  const stage = bathEl.querySelector('#bath-stage');
  stage.querySelectorAll('.pet').forEach(p => p.remove());
  stage.querySelectorAll('.st').forEach(s => s.classList.remove('lit'));
  const p = $(`<div class="pet happy"><div class="rig">${petSVG(state.pet.breed, state.wardrobe.equipped)}</div></div>`);
  stage.insertBefore(p, stage.querySelector('svg.tub'));
  pet.el.style.opacity = '0';
  bathEl.classList.add('show');
  sfx.splash();
  elfSay('哗啦啦～用手指搓出好多泡泡吧！', 'bath_start', 5000);
}
function finishBath() {
  if (!bathOpen) return;
  bathOpen = false;
  sfx.splash(); sfx.sparkle();
  setTimeout(() => {
    bathEl.classList.remove('show');
    pet.el.style.opacity = '1';
    pet.el.classList.add('shake');
    setTimeout(() => pet.el.classList.remove('shake'), 600);
    state.stats.clean = 100; save();
    pet.happy(3000); pet.bark();
    pet.showThought('✨');
    addHearts(8, pet.x * W, (pet.y - 0.2) * H);
    elfSay('哇，香喷喷亮晶晶！', 'bath_done');
  }, 900);
}

/* ---------------- 梳毛 ---------------- */
let groomCount = 0;
function startGroom() {
  if (nightOn || bathOpen || groomMode) return;
  groomMode = true; groomCount = 0;
  pet.setMode('idle'); pet.tx = pet.x; pet.ty = pet.y;
  elfSay('在它身上轻轻划一划，给毛毛做个美容～', 'brush_start', 5000);
}
function groomProgress(x, y) {
  groomCount++;
  sfx.brush();
  particle(x, y, pick(['✨', '🫧']));
  pet.happy(1500);
  if (groomCount >= 10) {
    groomMode = false;
    sfx.sparkle();
    pet.bounce(); pet.bark();
    pet.showThought('💖');
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
    document.getElementById('shop').classList.remove('show');
    document.getElementById('wardrobe').classList.remove('show');
    const bedPos = state.decor.bed;
    const go = bedPos ? [bedPos.x, bedPos.y - 0.022] : [0.5, 0.78];
    pet.goto(go[0], go[1], () => pet.setMode('sleep'));
    sfx.night();
    elfSay('嘘——宝贝要睡觉啦，晚安～', 'sleep', 5000);
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
  pet.setMode('idle');
  pet.bounce(); pet.happy(3000); pet.bark();
  state.stats.energy = 100; save();
  sfx.chime();
  addHearts(3, pet.x * W, (pet.y - 0.2) * H);
  elfSay('早上好呀！睡饱饱，精神好！', 'wake');
}

/* ---------------- 商店 ---------------- */
function buildShop() {
  const shop = $(`<div id="shop"><h3>温暖小家具 <button class="btn" id="shop-close">✕</button></h3><div id="shop-list"></div></div>`);
  const list = shop.querySelector('#shop-list');
  for (const f of FURNI) {
    const item = $(`<div class="shop-item" data-id="${f.id}">
      <div class="thumb">${f.svg}</div>
      <div class="info"><div class="name">${f.name}</div><div class="price">💗 ${f.price}</div></div>
    </div>`);
    item.addEventListener('pointerdown', () => buyFurni(f));
    list.appendChild(item);
  }
  shop.querySelector('#shop-close').addEventListener('pointerdown', () => {
    shop.classList.remove('show'); sfx.pip();
  });
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
function openShop() {
  if (nightOn || bathOpen) return;
  document.getElementById('wardrobe').classList.remove('show');
  document.getElementById('shop').classList.add('show');
  elfSay('用小爱心换温暖的小家具吧！', 'shop_open');
}
function buyFurni(f) {
  if (state.decor[f.id]) { wiggleFurni(f.id); sfx.pip(); return; }
  if (state.hearts < f.price) {
    sfx.pip();
    elfSay('爱心还差一点点，多陪陪它就有啦！', 'no_hearts');
    heartPill.classList.remove('pulse'); void heartPill.offsetWidth;
    heartPill.classList.add('pulse');
    return;
  }
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
  if (f.use === 'play') setTimeout(() => pet.autonomy(), 1200);
}

/* ---------------- 换装衣柜 ---------------- */
function buildWardrobe() {
  const wd = $(`<div id="wardrobe"><h3>漂亮衣柜 <button class="btn" id="wd-close">✕</button></h3><div id="wd-list"></div></div>`);
  const list = wd.querySelector('#wd-list');
  for (const c of CLOTHES) {
    const item = $(`<div class="shop-item wd-item" data-id="${c.id}">
      <div class="thumb cloth-thumb"><span>${c.icon}</span></div>
      <div class="info"><div class="name">${c.name}</div><div class="price"></div></div>
    </div>`);
    item.addEventListener('pointerdown', () => tapCloth(c));
    list.appendChild(item);
  }
  wd.querySelector('#wd-close').addEventListener('pointerdown', () => {
    wd.classList.remove('show'); sfx.pip();
  });
  game.appendChild(wd);
  refreshWardrobe();
}
function refreshWardrobe() {
  document.querySelectorAll('#wardrobe .wd-item').forEach(el => {
    const c = CLOTHES.find(x => x.id === el.dataset.id);
    const owned = state.wardrobe.owned[c.id];
    const worn = state.wardrobe.equipped.includes(c.id);
    el.classList.toggle('owned', owned);
    el.classList.toggle('worn', worn);
    el.querySelector('.price').innerHTML = worn ? '穿着呢 💕' : owned ? '点一下穿上' : `💗 ${c.price}`;
  });
}
function tapCloth(c) {
  const wd = state.wardrobe;
  if (!wd.owned[c.id]) {
    if (state.hearts < c.price) {
      sfx.pip();
      elfSay('爱心还差一点点，多陪陪它就有啦！', 'no_hearts');
      return;
    }
    state.hearts -= c.price;
    heartPill.querySelector('.hnum').textContent = state.hearts;
    wd.owned[c.id] = true;
    sfx.ding();
  }
  const i = wd.equipped.indexOf(c.id);
  if (i >= 0) {
    wd.equipped.splice(i, 1);
    sfx.pip();
  } else {
    // 同槽位互斥
    wd.equipped = wd.equipped.filter(id => (CLOTHES.find(x => x.id === id) || {}).slot !== c.slot);
    wd.equipped.push(c.id);
    sfx.sparkle();
    pet.trick();
    elfSay(`哇，穿上${c.name}真好看！`, 'dress_on');
  }
  save();
  pet.refreshArt();
  refreshWardrobe();
}
function openWardrobe() {
  if (nightOn || bathOpen) return;
  document.getElementById('shop').classList.remove('show');
  document.getElementById('wardrobe').classList.add('show');
  elfSay('给它挑一件漂亮衣服吧！', 'dress_open');
}

/* ---------------- 公园：扔球 / 蝴蝶 / 朋友 ---------------- */
let parkTimers = [], ballBusy = false, friendCooldown = 0;
function startParkLife() {
  // 蝴蝶
  for (let i = 0; i < 3; i++) spawnButterfly(i);
  // 朋友互动检测
  parkTimers.push(setInterval(() => {
    if (!friend || !pet || scene !== 'park') return;
    const d = Math.hypot(pet.x - friend.x, pet.y - friend.y);
    if (d < 0.09 && Date.now() > friendCooldown) {
      friendCooldown = Date.now() + 12000;
      pet.trick();
      friend.el.classList.add('jump');
      setTimeout(() => friend.el.classList.remove('jump'), 900);
      addHearts(4, ((pet.x + friend.x) / 2) * W, (pet.y - 0.2) * H);
      elfSay(`${state.pet.name}交到新朋友啦！`, 'park_friend');
      sfx.sparkle();
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
  bf.style.left = '0px'; bf.style.top = '0px';
  game.appendChild(bf);
  const mv = setInterval(() => {
    if (scene !== 'park') return;
    t += 0.04;
    bx += Math.sin(t * 0.7 + i * 2) * 0.004;
    by += Math.cos(t * 1.1 + i) * 0.003;
    bx = clamp(bx, 0.06, 0.94); by = clamp(by, 0.2, 0.62);
    bf.style.transform = `translate3d(${bx * W}px, ${by * H}px, 0)`;
  }, 40);
  parkTimers.push(mv);
  bf.addEventListener('pointerdown', () => {
    sfx.sparkle();
    particle(bx * W, by * H, '✨', 3);
    bf.classList.add('flee');
    pet.goto(clamp(bx, 0.1, 0.9), clamp(by + 0.25, FLOOR().y0, FLOOR().y1), () => {
      pet.trick();
      addHearts(2, pet.x * W, (pet.y - 0.2) * H);
      if (Math.random() < 0.5) elfSay('追到蝴蝶啦，好厉害！', 'park_butterfly');
    });
    setTimeout(() => {
      bf.classList.remove('flee');
      bx = rand(0.1, 0.9); by = rand(0.25, 0.5);
    }, 2000);
  });
}
function throwBall() {
  if (ballBusy || !pet) return;
  ballBusy = true;
  sfx.pop(); voice('park_ball');
  const sx = 0.5, sy = 0.95;
  const txx = rand(0.2, 0.8), tyy = rand(FLOOR().y0 + 0.06, FLOOR().y1 - 0.04);
  const ball = $(`<div class="fetch-ball">${fetchBallSVG()}</div>`);
  game.appendChild(ball);
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
      pet.goto(txx, tyy, () => {
        ball.remove();
        pet.showThought('🥎');
        sfx.pip(); petVoice('bark');
        pet.goto(rand(0.4, 0.6), rand(0.7, 0.85), () => {
          pet.trick();
          addHearts(3, pet.x * W, (pet.y - 0.2) * H);
          elfSay(pick(['捡回来啦！再扔一次？', `${state.pet.name}跑得好快呀！`]), 'park_fetch');
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
  if (pet && pet.mode === 'idle') pet.happy(2500);
}

/* ---------------- 状态衰减 & 提醒 ---------------- */
setInterval(() => {
  if (!pet || nightOn) return;
  state.stats.hunger = Math.max(0, state.stats.hunger - 0.5);
  state.stats.clean = Math.max(0, state.stats.clean - 0.35);
  save();
  if (scene !== 'home') return;
  if (state.stats.hunger < 42 && Math.random() < 0.5) {
    pet.showThought('🍖');
    if (Math.random() < 0.4) elfSay('咕噜咕噜～小肚子在叫啦，我们喂点好吃的吧！', 'hungry');
  } else if (state.stats.clean < 40 && Math.random() < 0.4) {
    pet.showThought('🛁');
    if (Math.random() < 0.4) elfSay('身上有点脏脏啦，洗个泡泡澡吧！', 'dirty');
  }
}, 12000);

/* ---------------- 主循环 ---------------- */
let lastT = 0;
function startLoop() {
  const loop = (t) => {
    const dt = Math.min(t - lastT, 50); lastT = t;
    try {
      if (pet) pet.tick(dt, t);
      if (friend) friend.tick(dt, t);
    } catch (e) { console.error('tick error', e); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------------- 领养场景 ---------------- */
function buildAdopt() {
  const names = ['布丁', '豆豆', '可乐', '糯米', '雪球', '毛毛'];
  const sc = $(`<div id="adopt">
    <h1>🐾 欢迎来到宠物小窝</h1>
    <div class="sub">篮子里的小狗都想跟你回家，摸摸它们，选一只吧！</div>
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
      petVoice('bark');
      chosen = key;
      baskets.querySelectorAll('.basket').forEach(x => {
        x.classList.toggle('picked', x === b);
        x.classList.toggle('dim', x !== b);
      });
      const pv = b.querySelector('.pet');
      pv.classList.add('happy');
      pv.classList.remove('bounce'); void pv.offsetWidth; pv.classList.add('bounce');
      setTimeout(() => {
        if (chosen === key) sc.querySelector('#name-panel').classList.add('show');
      }, 900);
    });
    baskets.appendChild(b);
  }
  sc.querySelector('#name-grid').addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || !chosen) return;
    sfx.ding(); sfx.sparkle();
    voice('adopt_done');
    state.pet = { breed: chosen, name: btn.textContent };
    save();
    sc.classList.add('gone');
    setTimeout(() => {
      sc.remove();
      buildHome();
      setTimeout(() => {
        elfSay(`这就是你们温暖的小家～摸摸${state.pet.name}，它会很开心哦！`, 'home_first', 6000);
      }, 800);
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
    elfSay(`欢迎回来！${state.pet.name}好想你呀～`, null, 4000);
    pet.el.classList.add('jump'); pet.bark();
    setTimeout(() => pet.el.classList.remove('jump'), 900);
  }, 900);
} else {
  buildAdopt();
}
startLoop();

/* 调试直达（仅测试用） */
const dbg = new URLSearchParams(location.search).get('auto');
if (dbg && hasSave) setTimeout(() => {
  ({ night: toggleNight, bath: openBath, shop: openShop, feed: openTray,
     park: goPark, dress: openWardrobe })[dbg]?.();
}, 1500);
