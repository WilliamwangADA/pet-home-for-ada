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
const POSE_ART = {
  idle: 'idle', walk: 'walk', sit: 'sit', sleep: 'sleep', happy: 'happy',
};
const POSE_W = { idle: 1.0, walk: 1.06, sit: 0.92, sleep: 1.12, happy: 1.0 };

export class Pet extends Actor {
  constructor(stage, breed, name, opts = {}) {
    super(stage, { w: opts.w || 31 });
    this.breed = breed;
    this.name = name;
    this.idx = opts.idx ?? 0;
    this.npc = !!opts.npc;
    this.baseW = opts.w || 31;
    this.el.classList.add('pet');
    if (this.npc) this.el.classList.add('npc');

    // 5 张姿态图一次全建好并预解码，之后切姿态零延迟、不会闪空
    for (const k of Object.keys(POSE_ART)) this.addArt(`pets/${breed}_${POSE_ART[k]}.png`);
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

  setPose(p) {
    this.pose = p;
    this.setArt(`pets/${this.breed}_${POSE_ART[p]}.png`);
    this.w = this.baseW * (POSE_W[p] || 1);
    this.el.classList.toggle('sleeping', p === 'sleep');
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

    /* 跳跃 */
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpV -= 2400 * dt;
      this.jumpY += this.jumpV * dt;
      if (this.jumpY <= 0) { this.jumpY = 0; this.jumpV = 0; this.squashT = 0.16; }
    }

    /* 走路：上下小跳 + 左右摇摆，让静止的贴纸有步伐感 */
    const walking = this.mode === 'walk';
    this.phase += dt * (walking ? (this.running ? 11 : 7.5) : 1.6);
    const stepBob = walking ? Math.abs(Math.sin(this.phase)) * 7 : 0;
    const sway = walking ? Math.sin(this.phase) * 2.6 : 0;

    /* 呼吸 */
    const breathe = this.mode === 'sleep'
      ? Math.sin(time * 1.15) * 0.035
      : Math.sin(time * 2.2) * 0.014;

    /* 开心：多一点弹性 */
    const joy = isHappy ? Math.abs(Math.sin(time * 7)) * 5 : 0;

    this.bob = stepBob + this.jumpY + joy
      + (this.inTub ? Math.sin(time * 2.4) * 3 : 0);
    this.tilt = sway + (isHappy ? Math.sin(time * 6.5) * 2.2 : Math.sin(time * 0.8 + this.phase) * 0.5);

    /* 吃饭：身体前倾 + 有节奏地低头啃，让"在盆里吃"读得出来 */
    if (this.eating) {
      const dip = (Math.sin(time * 7) * 0.5 + 0.5);
      this.tilt = (this.flip ? -1 : 1) * (10 + dip * 7);
      this.bob = -dip * 5;
    }

    /* 落地挤压 */
    if (this.squashT > 0) {
      this.squashT -= dt;
      this.squash = 1 - Math.max(0, this.squashT / 0.16) * 0.16;
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
