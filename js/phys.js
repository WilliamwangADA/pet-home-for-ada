/* ============ 2.5D 物理：地面 (u,v) 平面 + 高度 h ============

   画面是手绘 2.5D，但世界是真的三维在算：
     · u,v  —— 地面平面坐标（v 越大越靠近镜头）
     · h    —— 离地高度，渲染时转成贴纸的上移量 + 影子缩小

   支持的碰撞：
     玩具 ↔ 边界 / 家具 / 宠物 / 玩具   （会弹、会滚、会被踢飞）
     宠物 ↔ 家具                        （绕开，不会穿模）
     宠物 ↔ 宠物                        （互相让开）

   单位：u/v 是 0~1 的屏幕比例，h 用同一量级（0.1 ≈ 一个身位高）。
   v 方向在世界里其实是"进深"，视觉上被压扁了，所以算距离时按 V_SQUASH 折算，
   否则前后两只宠物看着离得很远、判定却贴在一起。
*/
const V_SQUASH = 0.62;

export const dist = (a, b) => Math.hypot(a.u - b.u, (a.v - b.v) * V_SQUASH);

export class Body {
  /** @param {object} o 渲染对象（Actor），物理只改它的 u/v/h */
  constructor(o, r, opts = {}) {
    this.o = o;
    this.r = r;                       // 地面碰撞半径
    this.hr = opts.hr ?? r * 0.9;     // 半高（决定落地时 h 的静止值）
    this.vu = 0; this.vv = 0; this.vh = 0;
    this.rest = opts.rest ?? 0.52;    // 弹性
    this.fric = opts.fric ?? 2.2;     // 地面摩擦
    this.spin = opts.spin ?? 1;       // 滚动视觉强度
    this.mass = opts.mass ?? 1;
    this.sleep = true;
    this.o.h = this.hr;
  }
  get u() { return this.o.u; } set u(x) { this.o.u = x; }
  get v() { return this.o.v; } set v(x) { this.o.v = x; }
  get h() { return this.o.h; } set h(x) { this.o.h = x; }

  /** 踢一脚：水平速度 + 起跳 */
  kick(vu, vv, vh = 0.55) {
    this.vu = vu; this.vv = vv; this.vh = vh;
    this.sleep = false;
  }
  stop() { this.vu = this.vv = this.vh = 0; this.sleep = true; }
}

export class Phys {
  constructor(bounds) {
    this.bounds = bounds || { u0: 0.04, u1: 0.96, v0: 0.06, v1: 1.0 };
    this.bodies = [];
    this.statics = [];   // { u, v, r, soft }
    this.agents = [];    // { o, r, vu, vv, onHit }
    this.gravity = 2.6;  // 单位/秒²（h 的量级很小，所以重力也小）
    this.onImpact = null;
  }
  reset(bounds) {
    if (bounds) this.bounds = bounds;
    this.bodies.length = 0; this.statics.length = 0; this.agents.length = 0;
  }
  addBody(b) { this.bodies.push(b); return b; }
  removeBody(b) { this.bodies = this.bodies.filter(x => x !== b); }
  addStatic(s) { this.statics.push(s); return s; }
  removeStatic(s) { this.statics = this.statics.filter(x => x !== s); }
  addAgent(a) { this.agents.push(a); return a; }
  removeAgent(a) { this.agents = this.agents.filter(x => x !== a); }

  /** 找离某点最近的可动玩具（宠物 AI 用） */
  nearestBody(u, v, maxD = 1) {
    let best = null, bd = maxD;
    for (const b of this.bodies) {
      if (b.held) continue;
      const d = Math.hypot(b.u - u, (b.v - v) * V_SQUASH);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  step(dt) {
    this.resolveAgents();
    this.wakeByAgents();
    const B = this.bounds;

    for (const b of this.bodies) {
      if (b.held) continue;                       // 被手抓着时不受物理支配
      if (b.sleep && b.h <= b.hr + 1e-4) continue;

      b.vh -= this.gravity * dt;
      b.u += b.vu * dt;
      b.v += b.vv * dt;
      b.h += b.vh * dt;

      /* 落地：弹一下，然后摩擦减速 */
      if (b.h <= b.hr) {
        b.h = b.hr;
        if (Math.abs(b.vh) > 0.16) {
          b.vh = -b.vh * b.rest;
          if (this.onImpact) this.onImpact(b, 'ground', Math.abs(b.vh));
        } else b.vh = 0;
        const damp = Math.max(0, 1 - b.fric * dt);
        b.vu *= damp; b.vv *= damp;
      }

      /* 撞边界 */
      let hitWall = 0;
      if (b.u < B.u0 + b.r) { b.u = B.u0 + b.r; b.vu = Math.abs(b.vu) * b.rest; hitWall = 1; }
      if (b.u > B.u1 - b.r) { b.u = B.u1 - b.r; b.vu = -Math.abs(b.vu) * b.rest; hitWall = 1; }
      if (b.v < B.v0 + b.r * V_SQUASH) { b.v = B.v0 + b.r * V_SQUASH; b.vv = Math.abs(b.vv) * b.rest; hitWall = 1; }
      if (b.v > B.v1) { b.v = B.v1; b.vv = -Math.abs(b.vv) * b.rest; hitWall = 1; }
      if (hitWall && this.onImpact && Math.hypot(b.vu, b.vv) > 0.12) this.onImpact(b, 'wall', 1);

      /* 撞家具 */
      for (const s of this.statics) {
        if (s.body === b) continue;
        const du = b.u - s.u, dv = (b.v - s.v) * V_SQUASH;
        const d = Math.hypot(du, dv), min = s.r + b.r;
        if (d < min && d > 1e-5) {
          const nu = du / d, nv = dv / d;
          b.u = s.u + nu * min;
          b.v = s.v + (nv * min) / V_SQUASH;
          const dot = b.vu * nu + b.vv * nv;
          if (dot < 0) {
            b.vu -= 2 * dot * nu * b.rest;
            b.vv -= 2 * dot * nv * b.rest;
            if (this.onImpact) this.onImpact(b, 'furni', Math.abs(dot), s);
          }
        }
      }

      /* 被宠物撞飞 */
      for (const a of this.agents) {
        if (a.ghost) continue;
        const du = b.u - a.o.u, dv = (b.v - a.o.v) * V_SQUASH;
        const d = Math.hypot(du, dv), min = a.r + b.r;
        if (d < min && d > 1e-5 && b.h < a.r * 1.6) {
          const nu = du / d, nv = dv / d;
          b.u = a.o.u + nu * min;
          b.v = a.o.v + (nv * min) / V_SQUASH;
          const speed = Math.hypot(a.vu || 0, a.vv || 0);
          const push = 0.28 + speed * 1.8;
          b.vu = nu * push; b.vv = (nv * push) / V_SQUASH;
          if (b.vh < 0.2) b.vh = 0.34;
          b.sleep = false;
          if (a.onHit) a.onHit(b);
          if (this.onImpact) this.onImpact(b, 'pet', push, a);
        }
      }

      /* 玩具互撞 */
      for (const o of this.bodies) {
        if (o === b || o.held) continue;
        const du = b.u - o.u, dv = (b.v - o.v) * V_SQUASH, dh = b.h - o.h;
        const d = Math.sqrt(du * du + dv * dv + dh * dh), min = o.r + b.r;
        if (d < min && d > 1e-5) {
          const nu = du / d, nv = dv / d, nh = dh / d;
          const push = (min - d) * 0.5;
          b.u += nu * push; b.v += (nv * push) / V_SQUASH; b.h += nh * push;
          o.u -= nu * push; o.v -= (nv * push) / V_SQUASH; o.h -= nh * push;
          const rel = (b.vu - o.vu) * nu + (b.vv - o.vv) * nv;
          if (rel < 0) {
            const j = rel * 0.62;
            b.vu -= j * nu; b.vv -= j * nv;
            o.vu += j * nu; o.vv += j * nv;
            o.sleep = false;
            if (this.onImpact) this.onImpact(b, 'body', Math.abs(rel), o);
          }
        }
      }

      /* 滚动：给渲染层一个自转角 */
      if (b.spin) {
        const moved = Math.hypot(b.vu, b.vv) * dt;
        b.o.spin = (b.o.spin || 0) + (b.vu >= 0 ? 1 : -1) * moved / Math.max(0.02, b.r) * 57.3 * b.spin;
      }

      if (b.h <= b.hr + 1e-4 && Math.hypot(b.vu, b.vv) < 0.012 && Math.abs(b.vh) < 0.02) {
        b.stop();
      }
    }
  }

  /** 这个点能不能站得下（不在任何硬障碍里）。
      家具是可以被玩家拖走拖来的，所以"围着食盆的座位"必须动态检查，
      否则水碗刚好压在某个座位上，那只宠物就永远走不到、吃不上饭。 */
  isFree(u, v, r, ignore) {
    const B = this.bounds;
    if (u < B.u0 || u > B.u1 || v < B.v0 || v > B.v1) return false;
    for (const s of this.statics) {
      if (s.soft || s === ignore) continue;
      const d = Math.hypot(u - s.u, (v - s.v) * V_SQUASH);
      if (d < s.r + r * 0.85) return false;
    }
    return true;
  }

  /** 绕着某个点找一圈能站的位置（喂食围盆、睡觉围窝都用它） */
  ringSpots(cu, cv, R, count, r, ignore) {
    const out = [];
    for (let i = 0; i < count * 3 && out.length < count; i++) {
      const a = (i / (count * 3)) * Math.PI * 2 - Math.PI / 2;
      const u = cu + Math.cos(a) * R;
      const v = cv + Math.sin(a) * R / V_SQUASH;
      if (!this.isFree(u, v, r, ignore)) continue;
      // 和已选的点保持距离，免得两只宠物挤在一起互相推
      if (out.some((p) => Math.hypot(p.u - u, (p.v - v) * V_SQUASH) < r * 2.1)) continue;
      out.push({ u, v });
    }
    return out;
  }

  /** 避障：把"朝目标的方向"调整成"绕过障碍的方向"。
      不做这一步的话，宠物只会直线走，一旦目标在障碍物对面，
      它就会顶着障碍原地不动（走向食盆对面的座位时必然发生）。
      做法是势场法：目标方向 + 附近障碍的侧向排斥力。 */
  avoid(u, v, du, dv, r) {
    let ax = du, az = dv;
    for (const s of this.statics) {
      if (s.soft) continue;
      const ou = u - s.u, ov = (v - s.v) * V_SQUASH;
      const d = Math.hypot(ou, ov);
      const reach = s.r + r + 0.03;
      if (d > reach || d < 1e-5) continue;
      // 越近排斥越强；同时沿切线方向推一把，形成"绕行"而不是"顶牛"
      const w = (reach - d) / reach;
      ax += (ou / d) * w * 1.4;
      az += (ov / d) * w * 1.4;
      const side = (du * -ov + dv * ou) >= 0 ? 1 : -1;
      ax += (-ov / d) * side * w * 1.1;
      az += (ou / d) * side * w * 1.1;
    }
    const m = Math.hypot(ax, az) || 1;
    return { du: ax / m, dv: az / m };
  }

  /** 静止的玩具被宠物碰到时要先唤醒。
      不做这一步的话，停在地上的球会被 `if (b.sleep) continue` 直接跳过，
      宠物从它身上走过去也毫无反应 —— 看起来就是"根本没有碰撞"。 */
  wakeByAgents() {
    for (const b of this.bodies) {
      if (!b.sleep || b.held) continue;
      for (const a of this.agents) {
        if (a.ghost) continue;
        const du = b.u - a.o.u, dv = (b.v - a.o.v) * V_SQUASH;
        if (Math.hypot(du, dv) < a.r + b.r + 0.005) { b.sleep = false; break; }
      }
    }
  }

  /** 宠物：绕开家具、互不重叠、不出界 */
  resolveAgents() {
    const B = this.bounds;
    for (const a of this.agents) {
      if (a.ghost) continue;
      for (const s of this.statics) {
        if (s.soft) continue;
        let du = a.o.u - s.u, dv = (a.o.v - s.v) * V_SQUASH;
        let d = Math.hypot(du, dv);
        const min = s.r + a.r * 0.82;
        if (d < min) {
          /* 正好重合时要给一个方向再推。
             之前这里改的是 a.o.u 而不是 du，结果 du/d 仍然是 0，
             位置原地不动 —— 宠物走到家具正中心就永远卡在里面。 */
          if (d < 1e-5) { du = 0.01; dv = 0; d = 0.01; }
          a.o.u = s.u + (du / d) * min;
          a.o.v = s.v + ((dv / d) * min) / V_SQUASH;
        }
      }
    }
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const a = this.agents[i], b = this.agents[j];
        if (a.noPush || b.noPush || a.ghost || b.ghost) continue;
        let du = b.o.u - a.o.u, dv = (b.o.v - a.o.v) * V_SQUASH;
        let d = Math.hypot(du, dv);
        const min = a.r + b.r;
        if (d >= min) continue;
        if (d < 1e-5) { du = 0.02; dv = 0; d = 0.02; }
        const push = (min - d) * 0.5;
        a.o.u -= du / d * push; a.o.v -= (dv / d * push) / V_SQUASH;
        b.o.u += du / d * push; b.o.v += (dv / d * push) / V_SQUASH;
      }
    }
    for (const a of this.agents) {
      a.o.u = Math.max(B.u0, Math.min(B.u1, a.o.u));
      a.o.v = Math.max(B.v0, Math.min(B.v1, a.o.v));
    }
  }
}
