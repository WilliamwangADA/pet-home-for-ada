/* ============ 2.5D 舞台：手绘背景 + 贴纸角色 + 视差 ============
   画风是宫崎骏手绘，所以渲染层只做三件事：
     1) 把手绘背景铺满并按镜头做视差位移
     2) 把角色/道具当"纸片"摆进伪三维地面，按 y 排序 + 近大远小
     3) 一层前景遮挡压在最前面，制造纵深
   全部用 DOM + CSS transform，iPad 上走 GPU 合成，比 Canvas 逐帧重绘省电。 */

export const ART = 'assets/art/';

/* 地面梯形：屏幕比例坐标。宠物只在这个区域里活动 */
/* 按背景图实际构图逐张量出来的可站立区域：
   home —— 榻榻米+木廊只在画面最下方 74%~99%，远端被门框收窄
   park —— 草地从 60% 一直铺到底 */
export const GROUND = {
  home: { yNear: 0.90, yFar: 0.74, xNear: 0.02, xFar: 0.22 },
  park: { yNear: 0.92, yFar: 0.60, xNear: -0.02, xFar: 0.18 },
};

/* 近大远小：depth 0=最远 1=最近 */
export const SCALE_FAR = 0.52, SCALE_NEAR = 1.0;

export class Stage {
  constructor(root) {
    this.root = root;
    this.el = document.createElement('div');
    this.el.className = 'stage';
    this.el.innerHTML = `
      <div class="sky"></div>
      <img class="bg" alt="">
      <div class="world"></div>
      <img class="fg" alt="">
      <div class="air"></div>`;
    root.appendChild(this.el);
    this.bgEl = this.el.querySelector('.bg');
    this.fgEl = this.el.querySelector('.fg');
    this.worldEl = this.el.querySelector('.world');
    this.airEl = this.el.querySelector('.air');
    this.pan = 0; this.panT = 0;
    this.scene = 'home';
    this.actors = [];
  }

  setScene(name, { bg, fg }) {
    this.scene = name;
    this.bgEl.src = ART + 'bg/' + bg;
    if (fg) { this.fgEl.src = ART + 'bg/' + fg; this.fgEl.style.display = ''; }
    else this.fgEl.style.display = 'none';
    this.worldEl.innerHTML = '';
    this.actors = [];
    this.buildAir(name);
  }

  /* 空气感：飘浮的光尘 + 偶尔飘过的花瓣 */
  buildAir(name) {
    let html = '';
    const n = name === 'park' ? 26 : 18;
    for (let i = 0; i < n; i++) {
      const s = 2 + Math.random() * 5;
      html += `<i class="mote" style="
        left:${Math.random() * 100}%;top:${20 + Math.random() * 70}%;
        width:${s}px;height:${s}px;
        animation-duration:${9 + Math.random() * 12}s;
        animation-delay:${-Math.random() * 14}s;opacity:${0.25 + Math.random() * 0.5}"></i>`;
    }
    if (name === 'park') {
      for (let i = 0; i < 7; i++) {
        html += `<i class="petal" style="
          left:${Math.random() * 100}%;top:${-10 - Math.random() * 30}%;
          animation-duration:${11 + Math.random() * 9}s;
          animation-delay:${-Math.random() * 18}s"></i>`;
      }
    }
    this.airEl.innerHTML = html;
  }

  /* 屏幕比例 → 地面坐标。u:0~1 横向, v:0~1 纵深(0=最远) */
  ground(u, v) {
    const g = GROUND[this.scene] || GROUND.home;
    const y = g.yFar + (g.yNear - g.yFar) * v;
    const inset = g.xFar + (g.xNear - g.xFar) * v;
    const x = inset + (1 - inset * 2) * u;
    return { x, y, scale: SCALE_FAR + (SCALE_NEAR - SCALE_FAR) * v };
  }

  add(actor) {
    this.worldEl.appendChild(actor.el);
    this.actors.push(actor);
    return actor;
  }
  remove(actor) {
    actor.el.remove();
    this.actors = this.actors.filter(a => a !== actor);
  }

  /* 镜头轻微横摇（手指拖背景），背景/前景走不同速度 = 视差 */
  nudge(dx) { this.panT = Math.max(-1, Math.min(1, this.panT + dx / innerWidth * 2.2)); }
  release() { this.panT *= 0.3; }

  update(dt) {
    this.pan += (this.panT - this.pan) * Math.min(1, dt * 5);
    const p = this.pan;
    this.bgEl.style.transform = `translate3d(${-p * 2.2}%, 0, 0) scale(1.06)`;
    this.fgEl.style.transform = `translate3d(${-p * 6.5}%, 0, 0) scale(1.04)`;
    this.worldEl.style.transform = `translate3d(${-p * 4.0}%, 0, 0)`;
    // 纸片按纵深排序，近的盖住远的
    for (const a of this.actors) a.draw();
  }
}

/* ---------------- 纸片角色 ----------------
   结构：.actor > .rig > img.art ×N
   把动画 transform 放在 .rig 上，图片本身只负责显示哪一张。
   多张图一次建好、靠 hidden 切换，而不是改 img.src ——
   改 src 会触发重新解码，解码那几帧图是空的或只画了一半，
   看起来就像"移动时身体中间透明了"。 */
export class Actor {
  constructor(stage, { w = 22 } = {}) {
    this.stage = stage;
    this.u = 0.5; this.v = 0.6;
    this.h = 0;              // 离地高度（物理单位，和 u/v 同量级）
    this.spin = 0;           // 滚动角（度）
    this.w = w;
    this.flip = false;
    this.bob = 0;
    this.tilt = 0;
    this.squash = 1;
    this.extraY = 0;
    this.zOverride = null;
    this.el = document.createElement('div');
    this.el.className = 'actor';
    this.el.innerHTML = `<div class="shadow"></div><div class="rig"></div>`;
    this.rig = this.el.querySelector('.rig');
    this.shadow = this.el.querySelector('.shadow');
    this.imgs = new Map();
    this.img = null;
  }

  /** 预建一批贴图（同时预解码），之后 setArt 只切显示 */
  addArt(file) {
    if (this.imgs.has(file)) return this.imgs.get(file);
    const im = document.createElement('img');
    im.className = 'art';
    im.alt = '';
    im.decoding = 'sync';
    im.hidden = true;
    im.addEventListener('error', () => { im.dataset.bad = '1'; });
    im.src = ART + file;
    this.rig.appendChild(im);
    this.imgs.set(file, im);
    return im;
  }
  setArt(file) {
    if (this._cur === file) return;
    const im = this.addArt(file);
    if (this.img) this.img.hidden = true;
    im.hidden = false;
    this.img = im;
    this._cur = file;
  }

  draw() {
    if (this.wall) {
      this.el.style.width = this.w + 'vmin';
      this.el.style.left = this.u * 100 + '%';
      this.el.style.top = this.wallY * 100 + '%';
      this.el.style.zIndex = 900;
      this.rig.style.transform = `rotate(${this.tilt}deg)`;
      this.shadow.style.display = 'none';
      return;
    }
    const g = this.stage.ground(this.u, this.v);
    const s = g.scale;
    /* 高度 h 是世界单位，换算成屏幕像素才能画出"飞起来"。
       1.0 个 h ≈ 一屏高，实际用到的都是 0.0x 量级。 */
    const hPx = this.h * innerHeight * 0.9 * s;
    this.el.style.width = this.w * s + 'vmin';
    this.el.style.left = g.x * 100 + '%';
    this.el.style.top = g.y * 100 + '%';
    this.el.style.zIndex = this.zOverride != null
      ? this.zOverride : Math.round(1000 + this.v * 1000);
    this.rig.style.transform =
      `translateY(${-this.bob - this.extraY - hPx}px) `
      + `rotate(${this.tilt + this.spin}deg) scale(${this.flip ? -1 : 1}, ${this.squash})`;
    /* 飞得越高，影子越小越淡 */
    const lift = this.bob + this.extraY + hPx;
    this.shadow.style.transform =
      `translate(-50%,50%) scale(${Math.max(0.35, 1 - lift / 140)})`;
    this.shadow.style.opacity = Math.max(0.08, 0.34 - lift / 420);
  }
}
