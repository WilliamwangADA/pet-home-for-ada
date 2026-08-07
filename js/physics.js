/* ============ 轻量物理：重力 / 地面弹跳 / 圆形碰撞 / 滚动 ============
   只做这个游戏需要的那点物理，不引第三方引擎，保证 iPad 秒开。 */
import { THREE } from './engine.js';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

export class Body {
  constructor(obj, r, opts = {}) {
    this.obj = obj;                 // 被驱动的 Object3D（原点须在质心）
    this.r = r;
    this.hitR = opts.hitR || r;     // 被宠物撞到的判定半径（可比几何半径大）
    this.vel = new THREE.Vector3();
    this.rest = opts.rest ?? 0.52;  // 弹性
    this.fric = opts.fric ?? 1.9;   // 地面摩擦
    this.mass = opts.mass ?? 1;
    this.roll = opts.roll !== false;
    this.sleep = true;
  }
  get pos() { return this.obj.position; }
  kick(vx, vz, vy = 2.2) {
    this.vel.set(vx, vy, vz);
    this.sleep = false;
  }
}

export class PhysWorld {
  constructor(bounds) {
    this.bounds = bounds;
    this.statics = [];              // {x,z,r}
    this.bodies = [];
    this.agents = [];               // {pos:{x,z}, r, vx, vz}
    this.gravity = -18;
  }
  reset(bounds) {
    this.bounds = bounds || this.bounds;
    this.statics.length = 0;
    this.bodies.length = 0;
    this.agents.length = 0;
  }
  addStatic(s) { this.statics.push(s); return s; }
  removeStatic(s) { this.statics = this.statics.filter(x => x !== s); }
  addBody(b) { this.bodies.push(b); return b; }
  removeBody(b) { this.bodies = this.bodies.filter(x => x !== b); }

  step(dt) {
    const B = this.bounds;
    for (const b of this.bodies) {
      if (b.sleep && b.pos.y <= b.r + 0.002) continue;
      b.vel.y += this.gravity * dt;
      const px = b.pos.x, pz = b.pos.z;
      b.pos.addScaledVector(b.vel, dt);

      // 地面
      if (b.pos.y < b.r) {
        b.pos.y = b.r;
        if (Math.abs(b.vel.y) > 0.6) b.vel.y = -b.vel.y * b.rest;
        else b.vel.y = 0;
        // 滚动摩擦
        const damp = Math.max(0, 1 - this.fricOf(b) * dt);
        b.vel.x *= damp; b.vel.z *= damp;
      }
      // 边界
      if (b.pos.x < B.x0 + b.r) { b.pos.x = B.x0 + b.r; b.vel.x = Math.abs(b.vel.x) * b.rest; }
      if (b.pos.x > B.x1 - b.r) { b.pos.x = B.x1 - b.r; b.vel.x = -Math.abs(b.vel.x) * b.rest; }
      if (b.pos.z < B.z0 + b.r) { b.pos.z = B.z0 + b.r; b.vel.z = Math.abs(b.vel.z) * b.rest; }
      if (b.pos.z > B.z1 - b.r) { b.pos.z = B.z1 - b.r; b.vel.z = -Math.abs(b.vel.z) * b.rest; }

      // 撞静态家具
      for (const s of this.statics) {
        if (s.body === b) continue;
        const dx = b.pos.x - s.x, dz = b.pos.z - s.z;
        const d = Math.hypot(dx, dz), min = s.r + b.r;
        if (d < min && d > 1e-4) {
          const nx = dx / d, nz = dz / d;
          b.pos.x = s.x + nx * min; b.pos.z = s.z + nz * min;
          const dot = b.vel.x * nx + b.vel.z * nz;
          if (dot < 0) { b.vel.x -= 2 * dot * nx * b.rest; b.vel.z -= 2 * dot * nz * b.rest; }
        }
      }
      // 撞宠物：被踢飞
      for (const a of this.agents) {
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz), min = a.r + b.hitR;
        if (d < min && d > 1e-4) {
          const nx = dx / d, nz = dz / d;
          b.pos.x = a.pos.x + nx * min; b.pos.z = a.pos.z + nz * min;
          const push = 1.6 + Math.hypot(a.vx || 0, a.vz || 0) * 2.4;
          b.vel.x = nx * push; b.vel.z = nz * push;
          if (b.vel.y < 0.4) b.vel.y = 1.5;
          b.sleep = false;
          if (a.onBump) a.onBump(b);
        }
      }
      // 动态之间
      for (const o of this.bodies) {
        if (o === b) continue;
        const dx = b.pos.x - o.pos.x, dz = b.pos.z - o.pos.z, dy = b.pos.y - o.pos.y;
        const d = Math.sqrt(dx * dx + dz * dz + dy * dy), min = o.r + b.r;
        if (d < min && d > 1e-4) {
          const nx = dx / d, ny = dy / d, nz = dz / d;
          const push = (min - d) * 0.5;
          b.pos.x += nx * push; b.pos.y += ny * push; b.pos.z += nz * push;
          o.pos.x -= nx * push; o.pos.y -= ny * push; o.pos.z -= nz * push;
          const rel = (b.vel.x - o.vel.x) * nx + (b.vel.z - o.vel.z) * nz;
          if (rel < 0) {
            b.vel.x -= rel * nx * 0.6; b.vel.z -= rel * nz * 0.6;
            o.vel.x += rel * nx * 0.6; o.vel.z += rel * nz * 0.6;
            o.sleep = false;
          }
        }
      }

      // 滚动
      if (b.roll) {
        const dx = b.pos.x - px, dz = b.pos.z - pz;
        const dist = Math.hypot(dx, dz);
        if (dist > 1e-5) {
          _v.set(dz, 0, -dx).normalize();
          _q.setFromAxisAngle(_v, -dist / b.r);
          b.obj.quaternion.premultiply(_q);
        }
      }
      // 休眠
      if (b.pos.y <= b.r + 0.002 && b.vel.lengthSq() < 0.012) {
        b.vel.set(0, 0, 0);
        b.sleep = true;
      }
    }
  }
  fricOf(b) { return b.fric; }

  /** 宠物躲开家具 + 互相分开；返回是否被推动 */
  resolveAgents() {
    const B = this.bounds;
    for (const a of this.agents) {
      if (a.ghost) continue;          // 进浴缸/被抱起的宠物不吃地面碰撞
      for (const s of this.statics) {
        if (s.soft) continue;
        const dx = a.pos.x - s.x, dz = a.pos.z - s.z;
        let d = Math.hypot(dx, dz);
        const min = s.r + a.r * 0.8;
        if (d < min) {
          if (d < 1e-4) { a.pos.x += 0.01; d = 0.01; }
          a.pos.x = s.x + (dx / d) * min;
          a.pos.z = s.z + (dz / d) * min;
        }
      }
    }
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const a = this.agents[i], b = this.agents[j];
        if (a.noPush || b.noPush) continue;
        let dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        let d = Math.hypot(dx, dz);
        const min = a.r + b.r;
        if (d >= min) continue;
        if (d < 1e-4) { dx = 0.02; dz = 0; d = 0.02; }
        const push = (min - d) * 0.5;
        a.pos.x -= dx / d * push; a.pos.z -= dz / d * push;
        b.pos.x += dx / d * push; b.pos.z += dz / d * push;
      }
    }
    for (const a of this.agents) {
      a.pos.x = Math.max(B.x0, Math.min(B.x1, a.pos.x));
      a.pos.z = Math.max(B.z0, Math.min(B.z1, a.pos.z));
    }
  }
}
