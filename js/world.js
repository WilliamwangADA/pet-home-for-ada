/* ============ 环境：日夜 / 天气 / 四季 ============

   四季换背景（窗外景色真的变），日夜和天气用叠加层 ——
   否则 4季 × 4时段 × 4天气 = 64 张图，不现实。

   默认跟着现实走：早上玩就是早晨的房间，冬天玩就是雪景。
   也能在面板里手动切，孩子想看雪随时能看。
*/

/* ---------------- 时段 ---------------- */
export const PHASES = ['dawn', 'day', 'dusk', 'night'];
export const PHASE_LABEL = { dawn: '清晨', day: '白天', dusk: '黄昏', night: '夜晚' };

/* 每个时段的画面调子：
   tint  叠在画面上的颜色（rgba），mode 是混合方式
   bright/sat/warm 是对背景的滤镜 */
export const PHASE_LOOK = {
  dawn: {
    tint: 'rgba(255,196,150,.20)', mode: 'soft-light',
    bright: 1.02, sat: 1.02, hue: 4, label: '清晨',
    sky: '#ffd9b8',
  },
  day: {
    tint: 'rgba(255,246,214,.06)', mode: 'soft-light',
    bright: 1.0, sat: 1.0, hue: 0, label: '白天',
    sky: '#bfe3f5',
  },
  dusk: {
    tint: 'rgba(255,140,90,.26)', mode: 'soft-light',
    bright: .94, sat: 1.08, hue: -6, label: '黄昏',
    sky: '#ffb27a',
  },
  night: {
    tint: 'rgba(30,48,120,.52)', mode: 'multiply',
    bright: .62, sat: .72, hue: -14, label: '夜晚',
    sky: '#1b2447',
  },
};

/* ---------------- 天气 ---------------- */
export const WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'];
export const WEATHER_LABEL = { sunny: '晴天', cloudy: '多云', rain: '下雨', snow: '下雪' };
export const WEATHER_ICON = { sunny: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️' };
export const WEATHER_LOOK = {
  sunny: { bright: 1.03, sat: 1.05, veil: 'rgba(255,240,190,.05)' },
  cloudy: { bright: .93, sat: .88, veil: 'rgba(150,165,190,.16)' },
  rain: { bright: .82, sat: .78, veil: 'rgba(110,135,170,.24)' },
  snow: { bright: 1.0, sat: .8, veil: 'rgba(200,220,245,.18)' },
};

/* ---------------- 季节 ---------------- */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_LABEL = { spring: '春天', summer: '夏天', autumn: '秋天', winter: '冬天' };
export const SEASON_ICON = { spring: '🌸', summer: '🌿', autumn: '🍁', winter: '⛄' };
/* 每个季节偏爱的天气（抽签用的权重） */
export const SEASON_WEATHER = {
  spring: { sunny: 5, cloudy: 3, rain: 3, snow: 0 },
  summer: { sunny: 6, cloudy: 2, rain: 3, snow: 0 },
  autumn: { sunny: 4, cloudy: 4, rain: 2, snow: 0 },
  winter: { sunny: 3, cloudy: 3, rain: 0, snow: 5 },
};
/* 季节自带的飘落物（没下雨下雪时也有一点氛围） */
export const SEASON_FALL = {
  spring: { cls: 'petal-pink', n: 8 },
  summer: { cls: 'firefly', n: 0 },
  autumn: { cls: 'leaf', n: 9 },
  winter: { cls: '', n: 0 },
};

/** 按现实时间判断时段 */
export function phaseByClock(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}
/** 按现实月份判断季节 */
export function seasonByClock(d = new Date()) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}
/** 按季节抽一个天气 */
export function rollWeather(season) {
  const w = SEASON_WEATHER[season] || SEASON_WEATHER.spring;
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const k of WEATHERS) { r -= w[k] || 0; if (r <= 0) return k; }
  return 'sunny';
}

/* ============ 环境层：把上面这些变成画面 ============ */
export class World {
  constructor(root, stage) {
    this.stage = stage;
    this.el = document.createElement('div');
    this.el.id = 'env';
    this.el.innerHTML = `
      <div class="env-tint"></div>
      <div class="env-veil"></div>
      <div class="env-fall"></div>
      <div class="env-flash"></div>`;
    root.appendChild(this.el);
    this.tintEl = this.el.querySelector('.env-tint');
    this.veilEl = this.el.querySelector('.env-veil');
    this.fallEl = this.el.querySelector('.env-fall');
    this.flashEl = this.el.querySelector('.env-flash');

    this.phase = phaseByClock();
    this.season = seasonByClock();
    this.weather = rollWeather(this.season);
    this.auto = true;                  // 跟着现实时间走
    this.t = 0;
    this.nextRoll = 120;               // 每两分钟可能换一次天气
    this.scene = 'home';
  }

  /** 室内室外，决定雨雪是满屏下还是只下在窗外 */
  setScene(scene) {
    if (scene === this.scene) return;
    this.scene = scene;
    this._fallKey = null;              // 强制重建，室内室外颗数不一样
    this.buildFall();
  }
  get indoor() { return this.scene === 'home'; }

  set(part, v) {
    if (part === 'phase') { this.phase = v; this.auto = false; }
    if (part === 'season') { this.season = v; this.auto = false; this.weather = rollWeather(v); }
    if (part === 'weather') { this.weather = v; this.auto = false; }
    this.apply();
    return this;
  }
  setAuto() {
    this.auto = true;
    this.phase = phaseByClock();
    this.season = seasonByClock();
    this.weather = rollWeather(this.season);
    this.apply();
  }
  /** 睡觉时强制夜晚，醒来恢复 */
  forceNight(on) {
    this.forced = on ? 'night' : null;
    this.apply();
  }
  get curPhase() { return this.forced || this.phase; }

  /** 当前该用哪张背景 */
  bgFor(scene) {
    const s = this.season;
    return `bg_${scene}_${s}.jpg`;
  }

  apply() {
    const ph = PHASE_LOOK[this.curPhase] || PHASE_LOOK.day;
    const we = WEATHER_LOOK[this.weather] || WEATHER_LOOK.sunny;
    this.tintEl.style.background = ph.tint;
    this.tintEl.style.mixBlendMode = ph.mode;
    this.veilEl.style.background = we.veil;
    const bright = (ph.bright * we.bright).toFixed(3);
    const sat = (ph.sat * we.sat).toFixed(3);
    if (this.stage) {
      for (const el of [this.stage.bgEl, this.stage.fgEl]) {
        if (el) el.style.filter = `brightness(${bright}) saturate(${sat}) hue-rotate(${ph.hue}deg)`;
      }
    }
    this.buildFall();
  }

  /* 飘落物：雨滴 / 雪花 / 花瓣 / 落叶 */
  buildFall() {
    const w = this.weather, s = this.season;
    let cls = '', n = 0;
    if (w === 'rain') { cls = 'drop'; n = 46; }
    else if (w === 'snow') { cls = 'snow'; n = 34; }
    else {
      const f = SEASON_FALL[s] || {};
      cls = f.cls; n = f.n || 0;
    }
    /* 领养页是另一张画（木屋育婴室），窗洞对不上，索性不下 */
    if (this.scene === 'nursery') { cls = ''; n = 0; }
    /* 室内只有窗洞那一块看得见（约三分之一宽），颗数补一些，
       但不按面积等比放大 —— 隔着窗看雨本来就该稀一点，也省得 iPad 上卡 */
    const win = this.indoor && cls;
    this.fallEl.classList.toggle('win', !!win);
    if (win) n = Math.round(n * 1.6);
    if (this._fallKey === cls + n) return;
    this._fallKey = cls + n;
    if (!cls || !n) { this.fallEl.innerHTML = ''; return; }
    let html = '';
    for (let i = 0; i < n; i++) {
      const dur = cls === 'drop' ? (0.5 + Math.random() * 0.4) : (6 + Math.random() * 7);
      html += `<i class="${cls}" style="
        left:${Math.random() * 108 - 4}%;
        animation-duration:${dur}s;
        animation-delay:${-Math.random() * dur}s;
        --sw:${(Math.random() * 2 - 1).toFixed(2)};
        opacity:${(0.5 + Math.random() * 0.5).toFixed(2)};
        transform:scale(${(0.6 + Math.random() * 0.8).toFixed(2)})"></i>`;
    }
    this.fallEl.innerHTML = html;
    if (win) this.syncCam();      // 立刻对齐一次，别等下一帧
  }

  /** 雷雨时偶尔闪一下 */
  flash() {
    this.flashEl.classList.remove('on');
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('on');
  }

  /** 室内时让粒子层贴着背景图走，窗洞才不会跟画面错位 */
  syncCam() {
    if (!this.fallEl.classList.contains('win') || !this.stage) {
      // 出了屋就还原，不然院子的雨还带着室内那份位移
      if (this._cw != null) {
        this.fallEl.style.width = this.fallEl.style.transform = '';
        this._cw = this._ct = null;
      }
      return;
    }
    const bg = this.stage.bgEl;
    if (!bg) return;
    const w = bg.style.width || '140%', t = bg.style.transform;
    if (w !== this._cw) { this.fallEl.style.width = w; this._cw = w; }
    if (t !== this._ct) { this.fallEl.style.transform = t; this._ct = t; }
  }

  update(dt) {
    this.t += dt;
    this.syncCam();
    if (this.auto) {
      const p = phaseByClock(), s = seasonByClock();
      if (p !== this.phase || s !== this.season) {
        this.phase = p;
        if (s !== this.season) { this.season = s; this.weather = rollWeather(s); this.onSeason && this.onSeason(s); }
        this.apply();
      }
    }
    if (this.t > this.nextRoll) {
      this.nextRoll = this.t + 120 + Math.random() * 120;
      if (this.auto) {
        const w = rollWeather(this.season);
        if (w !== this.weather) { this.weather = w; this.apply(); this.onWeather && this.onWeather(w); }
      }
    }
    if (this.weather === 'rain' && Math.random() < dt * 0.06) this.flash();
  }
}
