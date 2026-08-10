/* ============ 宠物：手绘贴纸 + 姿态状态机 + 程序化动画 ============
   每只宠物有 5 张手绘图（站/走/坐/趴睡/开心）。
   "活起来"靠在贴纸上叠程序化运动：
     · 呼吸    —— 极缓慢的 scaleY 起伏
     · 走路    —— 上下小跳 + 左右摇摆（配合 walk 图的迈腿）
     · 开心    —— 弹跳 + 挤压拉伸
     · 睡觉    —— 更慢更深的呼吸 + 飘 z
   比逐帧动画省素材，比纯位移有生气。 */
import { Actor } from './stage.js';

const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

/* 各姿态对应的贴图与基础宽度（vmin） */
/* 每个姿态的帧序列。两帧交替 = 真正的动画循环：
   只有一张静止图时，宠物走路就是一张纸片在平移，腿完全不动。 */
const POSE_FRAMES = {
  idle:  ['idle', 'idle_b'],
  walk:  ['walk', 'walk_b'],
  happy: ['happy', 'happy_b'],
  sit:   ['sit'],
  sleep: ['sleep'],
};
/* 每秒切几帧 */
const POSE_FPS = { idle: 0.55, walk: 6.5, happy: 5 };
const POSE_W = { idle: 1.0, walk: 1.06, sit: 0.92, sleep: 1.12, happy: 1.0 };

export class Pet extends Actor {
  constructor(stage, breed, name, opts = {}) {
    super(stage, { w: opts.w || 31 });
    this.breed = breed;
    this.name = name;
    this.idx = opts.idx ?? 0;
    this.npc = !!opts.npc;
    this.baseW = this.baseW0 = opts.w || 31;
    this.el.classList.add('pet');
    if (this.npc) this.el.classList.add('npc');

    // 5 张姿态图一次全建好并预解码，之后切姿态零延迟、不会闪空
    for (const list of Object.values(POSE_FRAMES))
      for (const f of list) this.addArt(`pets/${breed}_${f}.png`);
    this.mode = 'idle';
    this.setPose('idle');

    this.tu = null; this.tv = null; this.onArrive = null;
    this.speed = 0.24;
    this.phase = rand(0, 9);
    this.mood = 0;
    this.happyUntil = 0;
    this.jumpV = 0; this.jumpY = 0;
    this.now = opts.now || 0;                 // 跟主循环共用一个累加时钟
    this.nextThink = this.now + rand(2, 5);
    this.strokeAcc = 0; this.petStreak = 0;
    this.buddyCd = 0;

    /* 情绪气泡 */
    this.bubble = document.createElement('div');
    this.bubble.className = 'thought';
    this.el.appendChild(this.bubble);
    /* 睡觉的 z */
    this.zzz = document.createElement('div');
    this.zzz.className = 'zzz';
    this.zzz.textContent = '💤';
    this.el.appendChild(this.zzz);
    /* 名牌（NPC 用） */
    if (opts.nametag) {
      const t = document.createElement('div');
      t.className = 'nametag';
      t.textContent = opts.nametag;
      this.el.appendChild(t);
    }
    /* 服饰挂层 */
    this.wear = document.createElement('div');
    this.wear.className = 'wear';
    this.el.appendChild(this.wear);
    this.setEquipped(opts.equipped || []);
  }

  /** 改整体尺寸（洗澡时缩小之类），立即生效 */
  setScale(k) { this.baseW = this.baseW0 * k; this.setPose(this.pose); }

  setPose(p) {
    this.pose = p;
    this.frames = (POSE_FRAMES[p] || [p]).filter(f => this.has(f));
    if (!this.frames.length) this.frames = [p];
    this.frameT = 0; this.frameI = 0;
    this.setArt(`pets/${this.breed}_${this.frames[0]}.png`);
    this.w = this.baseW * (POSE_W[p] || 1);
    this.el.classList.toggle('sleeping', p === 'sleep');
  }
  /** 这张帧图能不能用（第二帧素材可能还没生成，404 时自动退回单帧） */
  has(f) {
    const im = this.imgs.get(`pets/${this.breed}_${f}.png`);
    return !!im && im.dataset.bad !== '1';
  }
  /** 推进帧动画 */
  tickFrames(dt) {
    if (!this.frames || this.frames.length < 2) return;
    const fps = POSE_FPS[this.pose] || 4;
    this.frameT += dt * (this.pose === 'walk' && this.running ? fps * 1.45 : fps);
    if (this.frameT >= 1) {
      this.frameT = 0;
      // 跳过加载失败的帧
      for (let n = 0; n < this.frames.length; n++) {
        this.frameI = (this.frameI + 1) % this.frames.length;
        if (this.has(this.frames[this.frameI])) break;
      }
      this.setArt(`pets/${this.breed}_${this.frames[this.frameI]}.png`);
    }
  }

  setMode(m) {
    if (this.mode === m) return;
    this.mode = m;
    this.setPose(
      m === 'walk' ? 'walk'
        : m === 'sleep' ? 'sleep'
          : m === 'sit' ? 'sit'
            : m === 'eat' ? 'sit'
              : 'idle');
  }

  /* ---- 服饰：按锚点贴在贴纸上 ---- */
  setEquipped(list) {
    this.equipped = (list || []).slice();
    this.wear.innerHTML = this.equipped.map(id => {
      const a = WEAR_ANCHOR[id] || WEAR_ANCHOR._default;
      return `<img class="wear-item" src="assets/art/clothes/${id}.png"
        style="left:${a.x}%;top:${a.y}%;width:${a.w}%;transform:translate(-50%,-50%) rotate(${a.r || 0}deg)">`;
    }).join('');
  }

  /* ---- 动作 ---- */
  goto(u, v, then, run = false) {
    this.tu = Math.max(0.04, Math.min(0.96, u));
    this.tv = Math.max(0.05, Math.min(1, v));
    this.onArrive = then || null;
    this.running = run;
    this.setMode('walk');
  }
  stop() {
    this.tu = this.tv = null; this.onArrive = null; this.eating = false;
    if (this.mode === 'walk') this.setMode('idle');
  }
  jump(h = 1) { if (this.jumpY <= 0.5) this.jumpV = 620 * h; this.happy(1.6); }
  happy(sec = 2) {
    this.happyUntil = this.now + sec;
    if (this.mode === 'idle') this.setPose('happy');
  }
  think(emoji, ms = 2600) {
    this.bubble.textContent = emoji;
    this.bubble.classList.add('show');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => this.bubble.classList.remove('show'), ms);
  }
  faceTo(u) { this.flip = u < this.u; }
  /** 贴纸真实显示高度（px）。.actor 本身高度是 0，量它拿不到尺寸 */
  artHeight() { return this.rig.getBoundingClientRect().height || 0; }
  /** 当前显示身高（px）的快速估算。贴图接近正方形，用宽度近似即可，
      每帧调 getBoundingClientRect 太贵。 */
  h() {
    const vmin = Math.min(innerWidth, innerHeight) / 100;
    const g = this.stage.ground(this.u, this.v);
    return this.w * g.scale * vmin;
  }

  update(dt, time) {
    this.now = time;
    /* 在浴缸里就不走动，只轻轻浮 */
    if (this.inTub) { this.tu = this.tv = null; }

    /* 移动 */
    if (this.tu !== null) {
      const du = this.tu - this.u, dv = this.tv - this.v;
      const d = Math.hypot(du, dv * 0.7);
      const step = this.speed * (this.running ? 1.7 : 1) * dt;
      if (d < step * 1.2 || d < 0.004) {
        this.u = this.tu; this.v = this.tv;
        this.tu = this.tv = null;
        this.setMode('idle');
        const f = this.onArrive; this.onArrive = null;
        if (f) f();
      } else {
        this.u += du / d * step;
        this.v += dv / d * step * 0.7;
        this.flip = du < 0;
      }
    }

    const isHappy = this.happyUntil > time;
    this.mood = lerp(this.mood, isHappy ? 1 : (this.mode === 'sleep' ? 0 : 0.3), dt * 4);
    if (!isHappy && this.pose === 'happy' && this.mode === 'idle') this.setPose('idle');

    this.tickFrames(dt);

    /* 所有幅度都以【自身身高】为基准，不能写死像素：
       屏幕越大宠物越大，7px 的起伏在 iPad 上等于没动。 */
    const H = this.h();

    /* 跳跃 */
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpV -= H * 11 * dt;
      this.jumpY += this.jumpV * dt;
      if (this.jumpY <= 0) { this.jumpY = 0; this.jumpV = 0; this.squashT = 0.18; }
    }

    /* 走路：上下起伏 + 左右摇摆，配合两帧交替的迈腿 */
    const walking = this.mode === 'walk';
    this.phase += dt * (walking ? (this.running ? 11 : 7.5) : 1.6);
    const stepBob = walking ? Math.abs(Math.sin(this.phase)) * H * 0.075 : 0;
    const sway = walking ? Math.sin(this.phase) * 5.5 : 0;

    /* 呼吸 */
    const breathe = this.mode === 'sleep'
      ? Math.sin(time * 1.15) * 0.055
      : Math.sin(time * 2.2) * 0.035;

    /* 开心：弹起来 */
    const joy = isHappy ? Math.abs(Math.sin(time * 7)) * H * 0.06 : 0;

    this.bob = stepBob + this.jumpY + joy
      + (this.inTub ? Math.sin(time * 2.4) * H * 0.02 : 0);
    this.tilt = sway + (isHappy ? Math.sin(time * 6.5) * 5 : Math.sin(time * 0.8 + this.phase) * 1.2);

    /* 吃饭：身体前倾 + 有节奏地低头啃 */
    if (this.eating) {
      const dip = (Math.sin(time * 7) * 0.5 + 0.5);
      this.tilt = (this.flip ? -1 : 1) * (12 + dip * 9);
      this.bob = -dip * H * 0.05;
    }

    /* 落地挤压：明显一点才有重量感 */
    if (this.squashT > 0) {
      this.squashT -= dt;
      const k = Math.max(0, this.squashT / 0.18);
      this.squash = 1 - k * 0.22;
    } else this.squash = 1 + breathe;

  }
}

/* 服饰锚点：相对贴纸包围盒的百分比。整体贴的是"正面站立"图，
   其它姿态会有点飘，先按这套统一，后面按品种微调。 */
export const WEAR_ANCHOR = {
  _default: { x: 50, y: 20, w: 40 },
  bow: { x: 62, y: 14, w: 26, r: -12 },
  strawhat: { x: 50, y: 9, w: 56 },
  partyhat: { x: 56, y: 5, w: 32, r: 12 },
  flower: { x: 50, y: 13, w: 54 },
  scarf: { x: 50, y: 40, w: 52 },
  bowtie: { x: 50, y: 42, w: 30 },
  glasses: { x: 50, y: 24, w: 46 },
  wings: { x: 50, y: 44, w: 88 },
};
