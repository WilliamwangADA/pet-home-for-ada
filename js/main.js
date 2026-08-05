/* ============ Ada的宠物小窝 · 主逻辑 ============ */
import { BREEDS, petSVG, elfSVG, tubSVG, bowlSVG, FURNI, roomBgSVG } from './art.js';
import { sfx, voice, petVoice } from './audio.js';
import { state, load, save } from './save.js';

const game = document.getElementById('game');
let W = innerWidth, H = innerHeight;
addEventListener('resize', () => { W = innerWidth; H = innerHeight; });

const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* 地板活动区（屏幕比例） */
const FLOOR = { y0: 0.63, y1: 0.90, x0: 0.08, x1: 0.92 };
const depthScale = (y) => 0.72 + 0.5 * (y - FLOOR.y0) / (FLOOR.y1 - FLOOR.y0);

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
  heartPill.querySelector('.hnum').textContent = state.hearts;
  heartPill.classList.remove('pulse'); void heartPill.offsetWidth;
  heartPill.classList.add('pulse');
  sfx.coin();
  if (x !== undefined) particle(x, y, '💗', Math.min(n, 5));
}

/* ---------------- 小精灵 ---------------- */
let speechEl, speechTimer;
function elfSay(text, voiceName, dur = 4200) {
  speechEl.textContent = text;
  speechEl.classList.add('show');
  if (voiceName) voice(voiceName);
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => speechEl.classList.remove('show'), dur);
}

/* ---------------- 宠物实体 ---------------- */
class Pet {
  constructor(breed, name) {
    this.breed = breed; this.name = name;
    this.x = 0.5; this.y = 0.78;
    this.tx = 0.5; this.ty = 0.78;
    this.mode = 'idle';           // idle | walk | eat | sleep | play | groom
    this.el = $(`<div class="pet"><div class="rig">${petSVG(breed)}</div><div class="thought"></div><div class="zzz">💤</div></div>`);
    this.thought = this.el.querySelector('.thought');
    this.speed = 0.0022;
    this.nextThink = 0;
    this._strokeAcc = 0; this._lastStroke = 0;
    this.bindTouch();
    // 随机眨眼
    setInterval(() => {
      if (this.mode !== 'sleep' && !this.el.classList.contains('happy')) {
        this.el.classList.add('blink');
        setTimeout(() => this.el.classList.remove('blink'), 160);
      }
    }, rand(2800, 4500));
  }
  bindTouch() {
    this.el.addEventListener('pointerdown', (e) => {
      if (this.mode === 'sleep') return;
      this._lastStroke = { x: e.clientX, y: e.clientY };
      this.bounce(); this.bark();
    });
    this.el.addEventListener('pointermove', (e) => {
      if (this.mode === 'sleep' || !e.pressure && e.pointerType === 'mouse' && e.buttons === 0) return;
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
          const anim = Math.random() < 0.5 ? 'jump' : 'roll';
          this.el.classList.remove('jump', 'roll'); void this.el.offsetWidth;
          this.el.classList.add(anim);
          setTimeout(() => this.el.classList.remove(anim), 900);
          this.bark(); sfx.sparkle();
          particle(this.x * W, (this.y - 0.22) * H, '💖', 4);
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
  bark() { petVoice(Math.random() < 0.5 ? 'bark' : 'bark2'); }
  bounce() {
    this.el.classList.remove('bounce'); void this.el.offsetWidth;
    this.el.classList.add('bounce');
  }
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
    this.tx = clamp(x, FLOOR.x0, FLOOR.x1); this.ty = clamp(y, FLOOR.y0, FLOOR.y1);
    this.mode = 'walk'; this._arrive = then;
    this.el.classList.add('walking');
    this.el.classList.toggle('face-left', this.tx < this.x);
  }
  setMode(m) {
    this.mode = m;
    this.el.classList.remove('walking', 'eating', 'sleeping');
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
      this.goto(rand(FLOOR.x0 + 0.05, FLOOR.x1 - 0.05), rand(FLOOR.y0 + 0.03, FLOOR.y1 - 0.02));
    } else {
      this.happy(1500);
    }
  }
}

let pet = null;
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
  // 拖拽摆放
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    drag = { id: e.pointerId };
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    sfx.pip();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const x = clamp(e.clientX / W, 0.06, 0.94);
    const y = f.zone === 'wall'
      ? clamp(e.clientY / H, 0.16, 0.5)
      : clamp(e.clientY / H, FLOOR.y0, FLOOR.y1);
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

/* ---------------- 房间场景 ---------------- */
let bowlEl, worldEl;
function buildRoom() {
  game.innerHTML = '';
  game.insertAdjacentHTML('beforeend', roomBgSVG());
  worldEl = $('<div id="world"></div>');
  game.appendChild(worldEl);

  // 固定的食盆水碗
  bowlEl = $(`<div class="furni" id="bowl">${bowlSVG('food')}</div>`);
  bowlEl.style.cssText = 'width:13vmin;height:7.6vmin;margin-left:-6.5vmin;margin-top:-6.8vmin';
  placeFixed(bowlEl, 0.17, 0.72);
  const waterEl = $(`<div class="furni">${bowlSVG('water')}</div>`);
  waterEl.style.cssText = 'width:12vmin;height:7vmin;margin-left:-6vmin;margin-top:-6.3vmin';
  placeFixed(waterEl, 0.27, 0.76);
  waterEl.addEventListener('pointerdown', () => { sfx.bubble(); particle(0.27 * W, 0.7 * H, '💧'); });
  worldEl.appendChild(bowlEl); worldEl.appendChild(waterEl);

  // 已购家具
  for (const f of FURNI) if (state.decor[f.id]) spawnFurni(f, worldEl);

  // 宠物
  pet = new Pet(state.pet.breed, state.pet.name);
  pet.x = pet.tx = 0.55; pet.y = pet.ty = 0.76;
  worldEl.appendChild(pet.el);

  game.appendChild(fxLayer);

  // 夜幕
  const night = $('<div id="night"></div>');
  for (let i = 0; i < 14; i++) {
    const st = $('<div class="star">✦</div>');
    st.style.left = rand(3, 94) + '%'; st.style.top = rand(3, 55) + '%';
    st.style.fontSize = rand(1.5, 3.2) + 'vmin';
    st.style.animationDelay = rand(0, 2) + 's';
    night.appendChild(st);
  }
  game.appendChild(night);

  buildUI();
  startLoop();
}

function placeFixed(el, x, y) {
  el.style.transform = `translate3d(${x * W}px, ${y * H}px, 0) scale(${depthScale(y)})`;
  el.style.zIndex = Math.round(y * 1000);
  el.dataset.fx = x; el.dataset.fy = y;
  addEventListener('resize', () => {
    el.style.transform = `translate3d(${x * W}px, ${y * H}px, 0) scale(${depthScale(y)})`;
  });
}

/* ---------------- UI ---------------- */
function buildUI() {
  heartPill = $(`<div id="hud"><div id="heart-pill"><span class="hicon">💗</span><span class="hnum">${state.hearts}</span></div></div>`);
  game.appendChild(heartPill);
  heartPill = heartPill.querySelector('#heart-pill');

  const elf = $(`<div id="elf">${elfSVG()}</div>`);
  elf.addEventListener('pointerdown', () => {
    sfx.sparkle();
    elfSay(pick([
      `多陪陪${state.pet.name}，爱心就会越来越多哦！`,
      '摸摸它的小脑袋，它会很开心的～',
      '攒够爱心，可以给小窝添新家具呀！',
    ]), pick(['elf1', 'elf2']));
  });
  game.appendChild(elf);
  speechEl = $('<div id="speech"></div>');
  game.appendChild(speechEl);

  const bar = $(`<div id="toolbar">
    <button class="btn" data-act="feed"><span>🍖</span><i>喂饭</i></button>
    <button class="btn" data-act="bath"><span>🛁</span><i>洗澡</i></button>
    <button class="btn" data-act="groom"><span>✨</span><i>梳毛</i></button>
    <button class="btn" data-act="sleep"><span>🌙</span><i>睡觉</i></button>
    <button class="btn" data-act="shop"><span>🛒</span><i>商店</i></button>
  </div>`);
  bar.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (!b) return;
    sfx.pip();
    ({ feed: openTray, bath: openBath, groom: startGroom, sleep: toggleNight, shop: openShop })[b.dataset.act]();
  });
  game.appendChild(bar);

  buildTray();
  buildShop();
  buildBath();
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
  const bx = 0.17 * W, by = 0.66 * H;
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
    pet.goto(0.25, 0.75, () => {
      pet.el.classList.add('face-left');
      pet.setMode('eat');
      let n = 0;
      const munchT = setInterval(() => {
        sfx.munch();
        particle(0.185 * W, 0.68 * H, pick(['✦', '·']), 1);
        if (++n >= 5) {
          clearInterval(munchT);
          pet.setMode('idle');
          bowlEl.querySelector('.kibble').setAttribute('opacity', '0');
          state.stats.hunger = 100; save();
          pet.happy(3000); pet.bounce(); pet.bark();
          pet.showThought('😋');
          addHearts(5, 0.2 * W, 0.62 * H);
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
  const p = $(`<div class="pet happy"><div class="rig">${petSVG(state.pet.breed)}</div></div>`);
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
    const bedPos = state.decor.bed;
    const go = bedPos ? [bedPos.x, bedPos.y - 0.022] : [0.5, 0.8];
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
    item.addEventListener('pointerdown', () => buyFurni(f, item));
    list.appendChild(item);
  }
  shop.querySelector('#shop-close').addEventListener('pointerdown', () => {
    shop.classList.remove('show'); sfx.pip();
  });
  game.appendChild(shop);
  refreshShop();
}
function refreshShop() {
  document.querySelectorAll('.shop-item').forEach(el => {
    const f = FURNI.find(x => x.id === el.dataset.id);
    const owned = !!state.decor[f.id];
    el.classList.toggle('owned', owned);
    el.querySelector('.price').innerHTML = owned ? '已经搬回家啦 ✓' : `💗 ${f.price}`;
  });
}
function openShop() {
  if (nightOn || bathOpen) return;
  document.getElementById('shop').classList.add('show');
  elfSay('用小爱心换温暖的小家具吧！', 'shop_open');
}
function buyFurni(f, item) {
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
  state.decor[f.id] = f.zone === 'wall' ? { x: 0.62, y: 0.3 } : { x: rand(0.35, 0.7), y: rand(0.68, 0.85) };
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

/* ---------------- 状态衰减 & 提醒 ---------------- */
setInterval(() => {
  if (!pet || nightOn) return;
  state.stats.hunger = Math.max(0, state.stats.hunger - 0.5);
  state.stats.clean = Math.max(0, state.stats.clean - 0.35);
  save();
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
    try { if (pet) pet.tick(dt, t); } catch (e) { console.error('tick error', e); }
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
      <div class="pit"><div class="bart">${FURNI[0].svg}</div><div class="pet"><div class="rig">${petSVG(key)}</div></div></div>
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
      buildRoom();
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
setTimeout(() => document.getElementById('boot').remove(), 700);
if (hasSave) {
  buildRoom();
  setTimeout(() => {
    elfSay(`欢迎回来！${state.pet.name}好想你呀～`, null, 4000);
    pet.el.classList.add('jump'); pet.bark();
    setTimeout(() => pet.el.classList.remove('jump'), 900);
  }, 900);
} else {
  buildAdopt();
}

/* 调试直达（仅测试用，正常游玩无影响） */
const dbg = new URLSearchParams(location.search).get('auto');
if (dbg && hasSave) setTimeout(() => {
  ({ night: toggleNight, bath: openBath, shop: openShop, feed: openTray })[dbg]?.();
}, 1500);
