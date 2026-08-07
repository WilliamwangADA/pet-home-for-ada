/* ============ 3D 宠物：程序化建模 + 骨架 + 动画状态机 ============
   朝向约定：+Z 为正前方（面向镜头），rotation.y = atan2(dx, dz) */
import { THREE } from './engine.js';
import { furMat, plainFur, fuzzShell, solid, glossy } from './mat.js';
import { BREEDS } from './data.js';
import { buildCloth } from './props3d.js';

const SPH = new THREE.SphereGeometry(1, 20, 14);
const SPH_LO = new THREE.SphereGeometry(1, 12, 9);
const CONE = new THREE.ConeGeometry(1, 1, 14);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 10);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function ball(mat, sx, sy, sz, x = 0, y = 0, z = 0, lo = false) {
  const m = new THREE.Mesh(lo ? SPH_LO : SPH, mat);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  return m;
}

/* 毛茸茸外壳：复制一层放大的背面网格 */
function addFuzz(mesh, color, strength) {
  if (strength <= 0.02) return;
  const s = new THREE.Mesh(mesh.geometry, fuzzShell(color, strength));
  s.scale.copy(mesh.scale).multiplyScalar(1 + 0.035 + strength * 0.055);
  s.position.copy(mesh.position);
  s.rotation.copy(mesh.rotation);
  s.renderOrder = 1;
  mesh.parent.add(s);
}

export class Pet3D {
  constructor(breedKey, name, opts = {}) {
    this.breedKey = breedKey;
    this.breed = BREEDS[breedKey];
    this.name = name;
    this.cat = this.breed.kind === 'cat';
    this.npc = !!opts.npc;
    this.idx = opts.idx ?? 0;

    this.root = new THREE.Group();
    this.root.userData.pick = { type: 'pet', pet: this };

    this.mode = 'idle';
    this.pose = { bodyY: 0, pitch: 0, tuck: 0, sit: 0, headDown: 0 };
    this.poseT = { bodyY: 0, pitch: 0, tuck: 0, sit: 0, headDown: 0 };
    this.phase = rand(0, 6);
    this.speed = 0;
    this.heading = 0; this.headingT = 0;
    this.mood = 0;              // 0~1 开心度，驱动摇尾巴/耳朵
    this.blinkT = rand(1.5, 4);
    this.blinkAmt = 0;
    this.lookTarget = null;
    this.headYaw = 0; this.headPitch = 0;
    this.jumpV = 0; this.jumpY = 0;
    this.rollT = 0; this.shakeT = 0;
    this.chew = 0;
    this.tailWob = [];

    this.build();
    this.setEquipped(opts.equipped || []);
  }

  /* ---------------- 建模 ---------------- */
  build() {
    const b = this.breed, bd = b.build, coat = b.coat;
    const K = this.cat ? 0.92 : 1;                    // 猫整体略小
    this.K = K;

    const bodyMat = furMat(this.breedKey, b, 'body');
    const headMat = furMat(this.breedKey, b, 'head');
    const limbMat = plainFur(coat.base);
    const bellyMat = plainFur(coat.belly);
    this.limbMat = limbMat;

    const legLen = 0.54 * bd.leg * K;
    const bodyR = 0.50 * K;
    const bH = bodyR * 0.86 * bd.ht, bW = bodyR * 0.92 * bd.wd, bL = bodyR * 1.30 * bd.len;
    this.legLen = legLen; this.bodyH = bH;

    this.body = new THREE.Group();
    this.body.position.y = legLen + bH * 0.92;
    this.root.add(this.body);
    this.baseBodyY = this.body.position.y;

    // 躯干：胸腔 + 臀部两个球混合出腰身
    const torso = ball(bodyMat, bW, bH, bL);
    torso.castShadow = true;
    this.body.add(torso);
    this.torso = torso;
    addFuzz(torso, coat.base, b.fluff);

    const rump = ball(bodyMat, bW * 0.98, bH * 1.02, bL * 0.56, 0, -0.02 * K, -bL * 0.52);
    rump.castShadow = true;
    this.body.add(rump);
    addFuzz(rump, coat.base, b.fluff);

    const chest = ball(bellyMat, bW * 0.80, bH * 0.72, bL * 0.52, 0, -bH * 0.30, bL * 0.44);
    this.body.add(chest);

    // 脖子
    const neckR = 0.24 * bd.neck * K;
    const neck = ball(limbMat, neckR, neckR * 1.05, neckR * 1.1, 0, bH * 0.34, bL * 0.66);
    this.body.add(neck);

    // 头
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, bH * 0.52, bL * 0.78);
    this.body.add(this.headPivot);

    const hR = 0.42 * bd.head * K;
    this.headR = hR;
    const skull = ball(headMat, hR * 0.98, hR * 0.94, hR * 0.96);
    skull.castShadow = true;
    this.headPivot.add(skull);
    addFuzz(skull, coat.base, b.fluff);

    // 口鼻
    const mz = bd.muzzle;
    const muzzle = ball(bellyMat, hR * 0.46 * (0.9 + mz * 0.25), hR * 0.36, hR * 0.52 * mz + hR * 0.18,
      0, -hR * 0.30, hR * 0.72);
    this.headPivot.add(muzzle);
    this.muzzle = muzzle;

    const nz = muzzle.position.z + muzzle.scale.z * 0.86;
    const nose = ball(glossy(coat.nose, { rough: 0.18 }), hR * 0.15, hR * 0.12, hR * 0.11, 0, -hR * 0.24, nz);
    this.headPivot.add(nose);

    // 嘴
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(hR * 0.15, hR * 0.026, 6, 14, Math.PI),
      solid('#5b3f34', { rough: 0.6 }));
    mouth.rotation.set(Math.PI, 0, 0);
    mouth.position.set(0, -hR * 0.44, nz - hR * 0.06);
    this.headPivot.add(mouth);
    this.mouth = mouth;

    // 舌头（开心/吃饭时露出）
    const tongue = ball(solid('#f07c8f', { rough: 0.45 }), hR * 0.13, hR * 0.05, hR * 0.17,
      0, -hR * 0.50, nz - hR * 0.02);
    tongue.visible = false;
    this.headPivot.add(tongue);
    this.tongue = tongue;

    // 眼睛
    this.eyes = [];
    for (const s of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(s * hR * 0.40, hR * 0.10, hR * 0.70);
      g.rotation.y = s * 0.22;
      const white = ball(solid('#fdfbf8', { rough: 0.25 }), hR * 0.20, hR * 0.22, hR * 0.16, 0, 0, 0, true);
      const iris = ball(glossy(b.eye.iris, { rough: 0.12 }), hR * 0.145, hR * 0.16, hR * 0.10, 0, 0, hR * 0.09, true);
      const pupil = ball(glossy('#160f0c', { rough: 0.08 }),
        hR * (b.eye.pupil === 'slit' ? 0.045 : 0.085), hR * 0.115, hR * 0.06, 0, 0, hR * 0.14, true);
      const hi1 = ball(solid('#ffffff', { rough: 0.1 }), hR * 0.055, hR * 0.055, hR * 0.04, -hR * 0.05, hR * 0.06, hR * 0.17, true);
      const hi2 = ball(solid('#ffffff', { rough: 0.1 }), hR * 0.028, hR * 0.028, hR * 0.02, hR * 0.05, -hR * 0.04, hR * 0.17, true);
      g.add(white, iris, pupil, hi1, hi2);
      this.headPivot.add(g);
      this.eyes.push(g);
      // 眼皮（毛色，闭眼时压下来）
      const lid = ball(headMat, hR * 0.215, hR * 0.24, hR * 0.18, 0, hR * 0.24, 0, true);
      lid.visible = false;
      g.add(lid);
      g._lid = lid;
    }

    // 眉毛（柴柴/奶牛猫的白眉点）
    if (b.pattern.type === 'shiba') {
      for (const s of [-1, 1]) {
        this.headPivot.add(ball(plainFur(coat.belly), hR * 0.11, hR * 0.07, hR * 0.05,
          s * hR * 0.40, hR * 0.36, hR * 0.68));
      }
    }
    // 腮红
    for (const s of [-1, 1]) {
      const bl = ball(new THREE.MeshStandardMaterial({
        color: '#ff9fae', transparent: true, opacity: 0.42, roughness: 1,
      }), hR * 0.17, hR * 0.11, hR * 0.06, s * hR * 0.62, -hR * 0.16, hR * 0.54);
      this.headPivot.add(bl);
    }

    // 耳朵
    this.ears = [];
    this.buildEars(hR, headMat, coat);

    // 胡须（猫）
    if (this.cat) {
      const wMat = solid('#f4ece2', { rough: 0.5 });
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const w = new THREE.Mesh(CYL, wMat);
          w.scale.set(0.006, hR * 0.5, 0.006);
          w.position.set(s * hR * 0.34, -hR * 0.22 + i * hR * 0.09, nz - hR * 0.1);
          w.rotation.z = s * (Math.PI / 2 - 0.28 + i * 0.16);
          w.rotation.x = -0.2;
          this.headPivot.add(w);
        }
      }
    }

    // 四条腿（双关节）
    this.legs = [];
    const hipZ = bL * 0.48, shX = bW * 0.62;
    const spots = [[-shX, hipZ, 'fl'], [shX, hipZ, 'fr'], [-shX, -hipZ, 'bl'], [shX, -hipZ, 'br']];
    for (const [lx, lz, tag] of spots) {
      const hip = new THREE.Group();
      hip.position.set(lx, -bH * 0.42, lz);
      this.body.add(hip);
      const upR = 0.125 * K * bd.wd;
      const upper = new THREE.Mesh(SPH_LO, limbMat);
      upper.scale.set(upR, legLen * 0.34, upR * 1.05);
      upper.position.y = -legLen * 0.30;
      upper.castShadow = true;
      hip.add(upper);
      const knee = new THREE.Group();
      knee.position.y = -legLen * 0.58;
      hip.add(knee);
      const lower = new THREE.Mesh(SPH_LO, limbMat);
      lower.scale.set(upR * 0.86, legLen * 0.28, upR * 0.9);
      lower.position.y = -legLen * 0.26;
      knee.add(lower);
      const pawMat = (b.pattern.type === 'shiba' || b.pattern.type === 'blaze' || b.pattern.type === 'tuxedo')
        ? bellyMat : limbMat;
      const paw = new THREE.Mesh(SPH_LO, pawMat);
      paw.scale.set(upR * 1.05, upR * 0.72, upR * 1.35);
      paw.position.set(0, -legLen * 0.48, upR * 0.32);
      paw.castShadow = true;
      knee.add(paw);
      for (let t = -1; t <= 1; t++) {
        const toe = new THREE.Mesh(SPH_LO, pawMat);
        toe.scale.set(upR * 0.34, upR * 0.30, upR * 0.34);
        toe.position.set(t * upR * 0.52, -legLen * 0.52, upR * 1.28);
        knee.add(toe);
      }
      this.legs.push({ hip, knee, tag, front: tag[0] === 'f' });
    }

    // 尾巴
    this.buildTail(bL, bH, limbMat, coat);

    // 挂点
    this.slots = {};
    this.slots.head = new THREE.Group();
    this.slots.head.position.set(0, hR * 0.92, hR * 0.06);
    this.headPivot.add(this.slots.head);
    this.slots.face = new THREE.Group();
    this.slots.face.position.set(0, hR * 0.10, hR * 0.80);
    this.headPivot.add(this.slots.face);
    this.slots.neck = new THREE.Group();
    this.slots.neck.position.set(0, bH * 0.46, bL * 0.66);
    this.body.add(this.slots.neck);
    this.slots.back = new THREE.Group();
    this.slots.back.position.set(0, bH * 0.62, -bL * 0.18);
    this.body.add(this.slots.back);
    this.slotScale = hR;

    // 项圈
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.23 * K * bd.neck, 0.045 * K, 8, 20),
      glossy(b.collar, { rough: 0.35 }));
    collar.rotation.x = Math.PI / 2 - 0.28;
    collar.position.set(0, bH * 0.26, bL * 0.60);
    this.body.add(collar);
    const bell = new THREE.Mesh(SPH_LO, glossy('#ffd45e', { rough: 0.15, metal: 0.5 }));
    bell.scale.setScalar(0.055 * K);
    bell.position.set(0, bH * 0.10, bL * 0.72);
    this.body.add(bell);
  }

  buildEars(hR, headMat, coat) {
    const kind = this.breed.ear;
    const inMat = plainFur(coat.earIn, 0.9);
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      this.headPivot.add(pivot);
      this.ears.push({ pivot, side: s, kind });
      if (kind === 'point' || kind === 'cat') {
        const tall = kind === 'cat' ? 1.25 : 1.0;
        pivot.position.set(s * hR * 0.56, hR * 0.62, -hR * 0.02);
        pivot.rotation.z = -s * 0.30;
        const e = new THREE.Mesh(CONE, headMat);
        e.scale.set(hR * 0.34, hR * 0.62 * tall, hR * 0.22);
        e.position.y = hR * 0.30 * tall;
        e.castShadow = true;
        pivot.add(e);
        const ei = new THREE.Mesh(CONE, inMat);
        ei.scale.set(hR * 0.20, hR * 0.42 * tall, hR * 0.12);
        ei.position.set(0, hR * 0.26 * tall, hR * 0.10);
        pivot.add(ei);
      } else if (kind === 'big') {
        pivot.position.set(s * hR * 0.62, hR * 0.54, -hR * 0.04);
        pivot.rotation.z = -s * 0.24;
        const e = new THREE.Mesh(SPH, headMat);
        e.scale.set(hR * 0.30, hR * 0.52, hR * 0.16);
        e.position.y = hR * 0.44;
        e.castShadow = true;
        pivot.add(e);
        const ei = new THREE.Mesh(SPH, inMat);
        ei.scale.set(hR * 0.19, hR * 0.36, hR * 0.09);
        ei.position.set(0, hR * 0.42, hR * 0.10);
        pivot.add(ei);
      } else if (kind === 'floppy') {
        pivot.position.set(s * hR * 0.74, hR * 0.34, hR * 0.02);
        pivot.rotation.z = -s * 0.16;
        const e = new THREE.Mesh(SPH, headMat);
        e.scale.set(hR * 0.24, hR * 0.52, hR * 0.30);
        e.position.y = -hR * 0.40;
        e.castShadow = true;
        pivot.add(e);
        addFuzz(e, coat.base, this.breed.fluff);
      } else { // puff
        pivot.position.set(s * hR * 0.76, hR * 0.28, 0);
        const e = new THREE.Mesh(SPH, headMat);
        e.scale.setScalar(hR * 0.36);
        e.position.y = -hR * 0.16;
        e.castShadow = true;
        pivot.add(e);
        addFuzz(e, coat.base, this.breed.fluff);
      }
      pivot.userData.rest = { x: pivot.rotation.x, z: pivot.rotation.z };
    }
  }

  buildTail(bL, bH, limbMat, coat) {
    const kind = this.breed.tail;
    this.tailRoot = new THREE.Group();
    this.tailRoot.position.set(0, bH * 0.34, -bL * 0.98);
    this.body.add(this.tailRoot);
    this.tailSegs = [];
    const conf = {
      curl:    { n: 5, len: 0.16, r: 0.095, curve: 0.52, taper: 0.94 },
      nub:     { n: 2, len: 0.09, r: 0.095, curve: 0.20, taper: 0.9 },
      feather: { n: 4, len: 0.13, r: 0.08, curve: -0.14, taper: 0.93 },
      puff:    { n: 3, len: 0.09, r: 0.10, curve: 0.30, taper: 1.02 },
      cat:     { n: 7, len: 0.15, r: 0.075, curve: 0.14, taper: 0.97, hook: 0.30 },
    }[kind];
    let parent = this.tailRoot, r = conf.r * this.K;
    for (let i = 0; i < conf.n; i++) {
      const seg = new THREE.Group();
      seg.position.y = i === 0 ? 0 : conf.len * this.K;
      // 末几节额外加钩，猫尾才有那个标志性的弯尖
      const hook = conf.hook && i >= conf.n - 3 ? conf.hook * (i - (conf.n - 4)) : 0;
      seg.rotation.x = i === 0
        ? (kind === 'cat' ? -0.95 : kind === 'feather' ? -1.55 : kind === 'puff' ? -1.25 : -0.5)
        : conf.curve + hook;
      parent.add(seg);
      const wide = kind === 'feather' ? 1 + i * 0.22 : 1;
      const segLen = conf.len * this.K;
      // 圆柱做尾干 + 关节球盖住接缝，避免"串珠"感
      const m = new THREE.Mesh(CYL, limbMat);
      m.scale.set(r * wide, segLen * 1.06, r * (kind === 'feather' ? 0.78 : 1));
      m.position.y = segLen * 0.5;
      m.castShadow = true;
      seg.add(m);
      const joint = new THREE.Mesh(SPH_LO, limbMat);
      joint.scale.set(r * wide, r, r * (kind === 'feather' ? 0.78 : 1));
      seg.add(joint);
      if (kind === 'feather' && i > 0) {
        for (const sd of [-1, 1]) {
          const tuft = new THREE.Mesh(SPH_LO, limbMat);
          tuft.scale.set(r * 0.45, segLen * 0.85, r * 1.5);
          tuft.position.set(sd * r * wide * 0.7, segLen * 0.5, -r * 1.1);
          tuft.rotation.z = sd * 0.25;
          seg.add(tuft);
        }
      }
      if (kind === 'puff' && i === conf.n - 1) {
        const p = new THREE.Mesh(SPH, limbMat);
        p.scale.setScalar(0.17 * this.K);
        p.position.y = conf.len * this.K;
        seg.add(p);
        addFuzz(p, coat.base, this.breed.fluff);
      }
      if (kind === 'cat' && i === conf.n - 1) {
        const tip = new THREE.Mesh(SPH_LO, plainFur(coat.belly));
        tip.scale.set(r * 1.05, conf.len * this.K * 0.5, r * 1.05);
        tip.position.y = conf.len * this.K * 0.9;
        seg.add(tip);
      }
      seg.userData.rest = seg.rotation.x;
      this.tailSegs.push(seg);
      this.tailWob.push({ a: 0, v: 0 });
      parent = seg;
      r *= conf.taper;
    }
  }

  /* ---------------- 服饰 ---------------- */
  setEquipped(list) {
    this.equipped = list ? list.slice() : [];
    this.wingParts = [];
    for (const k of ['head', 'face', 'neck', 'back']) {
      const s = this.slots[k];
      while (s.children.length) s.remove(s.children[0]);
    }
    for (const id of this.equipped) {
      const built = buildCloth(id, this.slotScale, this);
      if (built) this.slots[built.slot].add(built.obj);
    }
  }

  /* ---------------- 动作 ---------------- */
  setMode(m) {
    if (this.mode === m) return;
    this.mode = m;
    const t = this.poseT;
    t.bodyY = 0; t.pitch = 0; t.tuck = 0; t.sit = 0; t.headDown = 0;
    if (m === 'sleep') { t.bodyY = -this.legLen * 0.92; t.tuck = 1; t.headDown = 0.55; }
    if (m === 'sit') { t.sit = 1; t.pitch = -0.18; }
    if (m === 'eat') { t.headDown = 1; t.bodyY = -this.legLen * 0.10; }
  }
  jump(h = 1) { if (this.jumpY <= 0.001) this.jumpV = 3.4 * h; this.happy(1.6); }
  roll() { this.rollT = 0.9; this.happy(2); }
  shake() { this.shakeT = 0.7; }
  happy(sec = 2) { this.happyUntil = performance.now() / 1000 + sec; }
  lookAtPoint(v) { this.lookTarget = v; this.lookUntil = performance.now() / 1000 + 2.5; }

  get position() { return this.root.position; }
  setPos(x, z) { this.root.position.set(x, this.root.position.y, z); }
  faceTo(x, z) {
    const dx = x - this.root.position.x, dz = z - this.root.position.z;
    if (Math.hypot(dx, dz) > 0.01) this.headingT = Math.atan2(dx, dz);
  }

  /* ---------------- 每帧更新 ---------------- */
  update(dt, time) {
    const nowS = time;
    const isHappy = this.happyUntil > nowS;
    this.mood = lerp(this.mood, isHappy ? 1 : (this.mode === 'sleep' ? 0 : 0.32), dt * 4);

    // 朝向平滑
    let d = this.headingT - this.heading;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.heading += d * Math.min(1, dt * 9);
    this.root.rotation.y = this.heading;

    // 姿态混合
    const p = this.pose, t = this.poseT, k = Math.min(1, dt * 6);
    for (const key in p) p[key] = lerp(p[key], t[key], k);

    // 跳跃
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpV -= 11 * dt;
      this.jumpY += this.jumpV * dt;
      if (this.jumpY <= 0) { this.jumpY = 0; this.jumpV = 0; }
    }
    // 打滚
    if (this.rollT > 0) this.rollT = Math.max(0, this.rollT - dt);
    const rollP = this.rollT > 0 ? (1 - this.rollT / 0.9) : 0;
    this.body.rotation.z = this.rollT > 0 ? rollP * Math.PI * 2 : 0;
    // 甩水
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);

    const walking = this.mode === 'walk';
    const spd = this.speed;
    if (walking) this.phase += dt * (5.2 + spd * 3.2);
    else this.phase += dt * 1.5;
    const ph = this.phase;

    // 身体：呼吸 + 走路起伏
    const breathe = Math.sin(nowS * (this.mode === 'sleep' ? 1.1 : 2.3)) * (this.mode === 'sleep' ? 0.022 : 0.012);
    const bob = walking ? Math.abs(Math.sin(ph)) * 0.045 : 0;
    this.body.position.y = this.baseBodyY + p.bodyY + bob + this.jumpY + breathe * 0.4;
    this.torso.scale.y = this.torsoBaseY || (this.torsoBaseY = this.torso.scale.y);
    this.torso.scale.y = this.torsoBaseY * (1 + breathe);
    this.body.rotation.x = p.pitch + (walking ? Math.sin(ph * 2) * 0.022 : 0) + p.sit * 0.34
      + (this.shakeT > 0 ? 0 : 0);
    this.body.rotation.y = this.shakeT > 0 ? Math.sin(this.shakeT * 46) * 0.16 : lerp(this.body.rotation.y, 0, dt * 8);

    // 腿
    for (let i = 0; i < this.legs.length; i++) {
      const L = this.legs[i];
      const off = L.tag === 'fl' || L.tag === 'br' ? 0 : Math.PI;
      if (p.tuck > 0.02) {
        // 趴下：前腿前伸，后腿收折
        const tuckHip = L.front ? -0.95 : 1.25;
        const tuckKnee = L.front ? 0.55 : -1.7;
        L.hip.rotation.x = lerp(0, tuckHip, p.tuck);
        L.knee.rotation.x = lerp(0, tuckKnee, p.tuck);
      } else if (p.sit > 0.02 && !L.front) {
        L.hip.rotation.x = lerp(0, 1.15, p.sit);
        L.knee.rotation.x = lerp(0, -1.85, p.sit);
      } else {
        const sw = walking ? Math.sin(ph + off) * 0.62 : Math.sin(nowS * 1.4 + i) * 0.018;
        L.hip.rotation.x = sw;
        L.knee.rotation.x = walking ? -Math.max(0, Math.sin(ph + off + 0.9)) * 0.75 : -0.05;
      }
    }

    // 尾巴：弹簧摆动
    const wagAmp = (this.mode === 'sleep' ? 0.04 : 0.16 + this.mood * 0.55) * (walking ? 1.25 : 1);
    const wagSpd = 5 + this.mood * 9;
    for (let i = 0; i < this.tailSegs.length; i++) {
      const seg = this.tailSegs[i], w = this.tailWob[i];
      const drive = Math.sin(nowS * wagSpd - i * 0.55) * wagAmp * (0.5 + i * 0.16);
      w.v += (drive - w.a) * 34 * dt;
      w.v *= 0.86;
      w.a += w.v * dt;
      seg.rotation.z = w.a;
      seg.rotation.x = seg.userData.rest + (this.mode === 'sleep' ? 0.28 : 0) - this.mood * 0.10;
    }

    // 耳朵：走动/开心时抖动，睡觉时下垂
    for (const e of this.ears) {
      const rest = e.pivot.userData.rest;
      const jig = (walking ? Math.sin(ph * 2 + e.side) * 0.10 : 0) + Math.sin(nowS * 3.1 + e.side * 2) * 0.02 * this.mood;
      const droop = this.mode === 'sleep' ? 0.5 : 0;
      e.pivot.rotation.x = lerp(e.pivot.rotation.x, jig + droop * (e.kind === 'floppy' ? 0.3 : 0.9), dt * 8);
      e.pivot.rotation.z = rest + (e.kind === 'floppy' ? Math.sin(ph * 2 + e.side) * 0.05 : 0)
        - e.side * this.mood * 0.05;
    }

    // 头：看向目标 + 上下点头 + 吃饭低头
    let yawT = 0, pitchT = 0;
    if (this.lookTarget && this.lookUntil > nowS && this.mode !== 'sleep') {
      const dx = this.lookTarget.x - this.root.position.x;
      const dz = this.lookTarget.z - this.root.position.z;
      let a = Math.atan2(dx, dz) - this.heading;
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      yawT = clamp(a, -0.7, 0.7);
      pitchT = clamp(((this.lookTarget.y || 1) - this.body.position.y) * -0.35, -0.35, 0.45);
    }
    if (p.headDown > 0.02) {
      pitchT = lerp(pitchT, 0.85, p.headDown);
      if (this.mode === 'eat') pitchT += Math.sin(nowS * 9) * 0.09;
    }
    if (this.mode === 'sleep') { pitchT = 0.62; yawT = 0.25; }
    this.headYaw = lerp(this.headYaw, yawT, dt * 5);
    this.headPitch = lerp(this.headPitch, pitchT, dt * 5);
    this.headPivot.rotation.y = this.headYaw;
    this.headPivot.rotation.x = this.headPitch + (walking ? Math.sin(ph * 2) * 0.03 : Math.sin(nowS * 1.7) * 0.012);
    this.headPivot.rotation.z = this.mode === 'sleep' ? 0.18 : Math.sin(nowS * 0.9) * 0.02;

    // 眨眼 / 闭眼
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blinkT = rand(2.2, 5.5); this.blinkAmt = 1; }
    this.blinkAmt = Math.max(0, this.blinkAmt - dt * 7);
    const closed = this.mode === 'sleep' ? 1 : (isHappy && this.mood > 0.8 ? 0.55 : this.blinkAmt);
    for (const e of this.eyes) {
      e.scale.y = lerp(1, 0.08, Math.min(1, closed));
      e._lid.visible = closed > 0.25;
    }

    // 舌头：开心或吃饭时露出
    const showTongue = this.mode === 'eat' || (isHappy && !this.cat);
    this.tongue.visible = showTongue;
    if (showTongue) this.tongue.position.y = this.tongueY0 ?? (this.tongueY0 = this.tongue.position.y);
    this.mouth.scale.y = lerp(this.mouth.scale.y, showTongue ? 1.5 : 1, dt * 8);
  }

  dispose() {
    this.root.traverse(o => { if (o.geometry && o.geometry.dispose && !o.geometry._shared) { /* 共享几何不释放 */ } });
    if (this.root.parent) this.root.parent.remove(this.root);
  }
}
