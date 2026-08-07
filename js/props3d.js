/* ============ 3D 道具：房间 / 公园 / 家具 / 食盆 / 浴缸 / 服饰 ============ */
import { THREE } from './engine.js';
import { solid, glossy, plainFur, woodTex, grassTex, rugTex, wallTex } from './mat.js';

const SPH = new THREE.SphereGeometry(1, 18, 12);
const SPH_LO = new THREE.SphereGeometry(1, 12, 8);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
const CONE = new THREE.ConeGeometry(1, 1, 18);

const mesh = (geo, mat, s, p, castS = true) => {
  const m = new THREE.Mesh(geo, mat);
  if (s) m.scale.set(s[0], s[1], s[2]);
  if (p) m.position.set(p[0], p[1], p[2]);
  m.castShadow = castS;
  m.receiveShadow = true;
  return m;
};

/* 房间尺寸 */
export const ROOM = { hw: 6.4, hd: 5.6, wallH: 6.2 };
export const HOME_BOUNDS = { x0: -4.2, x1: 4.2, z0: -3.8, z1: 2.6 };
export const PARK_BOUNDS = { x0: -6.0, x1: 6.0, z0: -4.8, z1: 3.2 };

/* ---------------- 房间 ---------------- */
export function buildRoom() {
  const g = new THREE.Group();
  const { hw, hd, wallH } = ROOM;

  const floor = mesh(BOX, new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.72 }),
    [hw * 2, 0.4, hd * 2], [0, -0.2, 0], false);
  floor.receiveShadow = true;
  g.add(floor);

  const rug = mesh(CYL, new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 0.95 }),
    [3.4, 0.03, 3.4], [0.2, 0.02, 0.6], false);
  rug.receiveShadow = true;
  g.add(rug);

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.9 });
  const back = mesh(BOX, wallMat, [hw * 2, wallH, 0.35], [0, wallH / 2 - 0.2, -hd], false);
  back.receiveShadow = true;
  g.add(back);
  const left = mesh(BOX, wallMat, [0.35, wallH, hd * 2], [-hw, wallH / 2 - 0.2, 0], false);
  left.receiveShadow = true;
  g.add(left);
  const right = mesh(BOX, wallMat, [0.35, wallH, hd * 2], [hw, wallH / 2 - 0.2, 0], false);
  right.receiveShadow = true;
  g.add(right);

  // 踢脚线
  const skirt = solid('#e8c9a6', { rough: 0.7 });
  g.add(mesh(BOX, skirt, [hw * 2, 0.34, 0.12], [0, 0.16, -hd + 0.2], false));
  g.add(mesh(BOX, skirt, [0.12, 0.34, hd * 2], [-hw + 0.2, 0.16, 0], false));
  g.add(mesh(BOX, skirt, [0.12, 0.34, hd * 2], [hw - 0.2, 0.16, 0], false));

  // 窗（左后）：窗框 + 天空 + 窗台
  const win = new THREE.Group();
  win.position.set(-3.0, 2.3, -hd + 0.18);
  const pane = mesh(BOX, solid('#a9d8f2', { rough: 0.25, extra: { emissive: 0x9fd0ee, emissiveIntensity: 0.55 } }),
    [2.5, 1.9, 0.06], [0, 0, 0], false);
  win.add(pane);
  g.userData.pane = pane;                  // 天黑时换成夜空色，见 main.js
  const frame = solid('#fff8ec', { rough: 0.6 });
  win.add(mesh(BOX, frame, [2.75, 0.16, 0.16], [0, 1.02, 0.04], false));
  win.add(mesh(BOX, frame, [2.75, 0.16, 0.16], [0, -1.02, 0.04], false));
  win.add(mesh(BOX, frame, [0.16, 2.15, 0.16], [-1.3, 0, 0.04], false));
  win.add(mesh(BOX, frame, [0.16, 2.15, 0.16], [1.3, 0, 0.04], false));
  win.add(mesh(BOX, frame, [0.11, 2.0, 0.12], [0, 0, 0.05], false));
  g.add(win);

  // 门（右后）→ 去公园
  const door = new THREE.Group();
  door.position.set(3.5, 0, -hd + 0.16);
  door.userData.pick = { type: 'door' };
  const dm = solid('#c98a52', { rough: 0.55 });
  door.add(mesh(BOX, dm, [2.0, 3.5, 0.16], [0, 1.75, 0], false));
  door.add(mesh(BOX, solid('#b0703c', { rough: 0.6 }), [1.6, 3.1, 0.08], [0, 1.75, 0.08], false));
  door.add(mesh(SPH_LO, glossy('#ffd45e', { rough: 0.15, metal: 0.6 }), [0.11, 0.11, 0.11], [0.72, 1.7, 0.16], false));
  // 爪印小牌
  const sign = mesh(BOX, solid('#fff3dd', { rough: 0.7 }), [0.95, 0.6, 0.06], [0, 2.75, 0.14], false);
  door.add(sign);
  const paw = solid('#e58a5a', { rough: 0.7 });
  door.add(mesh(SPH_LO, paw, [0.13, 0.09, 0.05], [0, 2.72, 0.19], false));
  for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.6;
    door.add(mesh(SPH_LO, paw, [0.055, 0.045, 0.04], [Math.cos(a) * 0.2, 2.86 + Math.sin(a) * 0.06, 0.19], false));
  }
  g.add(door);
  g.userData.door = door;

  // 墙上搁板 + 小罐
  const shelf = mesh(BOX, solid('#e0b183', { rough: 0.6 }), [2.2, 0.14, 0.5], [-0.4, 2.9, -hd + 0.35], true);
  g.add(shelf);
  g.add(mesh(CYL, glossy('#8fc7e8', { rough: 0.3 }), [0.18, 0.28, 0.18], [-1.0, 3.15, -hd + 0.35]));
  g.add(mesh(CYL, glossy('#f2a0c4', { rough: 0.3 }), [0.15, 0.22, 0.15], [-0.5, 3.12, -hd + 0.35]));
  g.add(mesh(SPH_LO, glossy('#ffd766', { rough: 0.3 }), [0.16, 0.16, 0.16], [0.1, 3.12, -hd + 0.35]));

  return g;
}

/* ---------------- 公园 ---------------- */
function skyDome() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#5fa8e6');
  gr.addColorStop(0.55, '#a8d8f5');
  gr.addColorStop(1, '#e9f4dc');
  x.fillStyle = gr; x.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(46, 20, 14),
    new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
  return m;
}

function tree(x, z, s = 1, tone = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(mesh(CYL, solid('#8d6239', { rough: 0.9 }), [0.28 * s, 1.5 * s, 0.28 * s], [0, 1.5 * s, 0]));
  const greens = ['#5aa84a', '#6fbb55', '#4d9642'];
  const geo = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 3; i++) {
    const c = mesh(geo, solid(greens[(i + tone) % 3], { rough: 0.95 }),
      [1.35 * s * (1 - i * 0.16), 1.15 * s * (1 - i * 0.12), 1.35 * s * (1 - i * 0.16)],
      [Math.sin(i * 2.1) * 0.35 * s, (2.9 + i * 0.75) * s, Math.cos(i * 1.7) * 0.35 * s]);
    g.add(c);
  }
  return g;
}

export function buildPark() {
  const g = new THREE.Group();
  g.add(skyDome());

  const ground = mesh(CYL, new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 0.98 }),
    [22, 0.4, 22], [0, -0.2, 0], false);
  ground.receiveShadow = true;
  g.add(ground);

  // 小径
  const path = mesh(BOX, solid('#dcc39a', { rough: 0.95 }), [3.0, 0.05, 18], [0.5, 0.03, 1], false);
  path.receiveShadow = true;
  g.add(path);

  // 树
  const spots = [[-9, -7, 1.15, 0], [-5.5, -9, 0.95, 1], [6.5, -8, 1.2, 2], [10, -5, 1.0, 1],
    [-11, -2, 1.05, 2], [11.5, 0.5, 0.9, 0], [-9.5, 4, 0.85, 1], [10.5, 5, 0.95, 2]];
  for (const [x, z, s, t] of spots) g.add(tree(x, z, s, t));

  // 栅栏
  const fMat = solid('#f0e2cb', { rough: 0.8 });
  for (let i = -8; i <= 8; i++) {
    const p = mesh(BOX, fMat, [0.16, 1.1, 0.16], [i * 1.15, 0.55, -6.4]);
    g.add(p);
  }
  g.add(mesh(BOX, fMat, [19, 0.13, 0.12], [0, 0.85, -6.4]));
  g.add(mesh(BOX, fMat, [19, 0.13, 0.12], [0, 0.45, -6.4]));

  // 池塘
  const pond = new THREE.Group();
  pond.position.set(-5.4, 0, 1.0);
  pond.add(mesh(CYL, solid('#c8b48c', { rough: 0.95 }), [2.5, 0.12, 2.5], [0, 0.05, 0], false));
  const water = mesh(CYL, new THREE.MeshStandardMaterial({
    color: '#4fa9d6', roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.9,
  }), [2.25, 0.1, 2.25], [0, 0.11, 0], false);
  pond.add(water);
  pond.userData.water = water;
  // 小鸭
  const duck = new THREE.Group();
  duck.position.set(0.5, 0.2, 0.2);
  duck.add(mesh(SPH_LO, solid('#ffd45e', { rough: 0.6 }), [0.3, 0.24, 0.36], [0, 0, 0]));
  duck.add(mesh(SPH_LO, solid('#ffd45e', { rough: 0.6 }), [0.17, 0.17, 0.17], [0, 0.24, 0.22]));
  duck.add(mesh(CONE, solid('#f08a3c', { rough: 0.5 }), [0.07, 0.16, 0.07], [0, 0.22, 0.38]));
  duck.children[2].rotation.x = Math.PI / 2;
  pond.add(duck);
  pond.userData.duck = duck;
  g.add(pond);
  g.userData.pond = pond;

  // 长椅
  const bench = new THREE.Group();
  bench.position.set(5.4, 0, 0.6);
  bench.rotation.y = -0.55;
  const wood = solid('#c98a52', { rough: 0.7 });
  bench.add(mesh(BOX, wood, [2.6, 0.14, 0.9], [0, 0.62, 0]));
  bench.add(mesh(BOX, wood, [2.6, 0.85, 0.13], [0, 1.05, -0.4]));
  for (const s of [-1, 1]) {
    bench.add(mesh(BOX, solid('#8d6239', { rough: 0.8 }), [0.14, 0.62, 0.14], [s * 1.1, 0.31, 0.32]));
    bench.add(mesh(BOX, solid('#8d6239', { rough: 0.8 }), [0.14, 0.62, 0.14], [s * 1.1, 0.31, -0.32]));
  }
  g.add(bench);

  // 花丛
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 8;
    const fx = Math.cos(a) * r, fz = Math.sin(a) * r * 0.7 - 1;
    if (Math.abs(fx) < 3 && Math.abs(fz) < 4) continue;
    const col = ['#ff9db5', '#ffd766', '#f6f0fa', '#c9a6ee'][(Math.random() * 4) | 0];
    const f = mesh(SPH_LO, solid(col, { rough: 0.85 }), [0.14, 0.12, 0.14], [fx, 0.28, fz]);
    g.add(f);
    g.add(mesh(CYL, solid('#5aa84a', { rough: 0.9 }), [0.03, 0.28, 0.03], [fx, 0.14, fz], false));
  }
  return g;
}

/* ---------------- 蝴蝶 ---------------- */
export function buildButterfly(color) {
  const g = new THREE.Group();
  const body = mesh(SPH_LO, solid('#5b4636', { rough: 0.7 }), [0.075, 0.075, 0.24], [0, 0, 0], false);
  g.add(body);
  const wm = new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.94 });
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(s * 0.03, 0, 0);
    const a = mesh(SPH_LO, wm, [0.33, 0.03, 0.24], [s * 0.3, 0, 0.06], false);
    const b = mesh(SPH_LO, wm, [0.23, 0.03, 0.17], [s * 0.22, 0, -0.18], false);
    w.add(a, b);
    g.add(w);
    wings.push({ w, s });
  }
  g.userData.wings = wings;
  g.userData.pick = { type: 'butterfly', obj: g };
  return g;
}

/* ---------------- 食盆 / 水碗 ---------------- */
export function buildBowl(kind) {
  const g = new THREE.Group();
  const color = kind === 'water' ? '#7fc8e8' : '#f2a0c4';
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.34, 0.34, 22, 1, true),
    glossy(color, { rough: 0.3 }));
  wall.material.side = THREE.DoubleSide;
  wall.position.y = 0.17; wall.castShadow = true; wall.receiveShadow = true;
  g.add(wall);
  g.add(mesh(CYL, glossy(color, { rough: 0.3 }), [0.34, 0.03, 0.34], [0, 0.02, 0], false));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 22), glossy(color, { rough: 0.3 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.34; rim.castShadow = true;
  g.add(rim);
  g.add(mesh(CYL, solid('#fff5e8', { rough: 0.5 }), [0.4, 0.04, 0.4], [0, 0.1, 0], false));
  if (kind === 'water') {
    g.add(mesh(CYL, new THREE.MeshStandardMaterial({
      color: '#63b8e0', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85,
    }), [0.44, 0.04, 0.44], [0, 0.26, 0], false));
  } else {
    const kib = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * 6.3, r = Math.random() * 0.32;
      kib.add(mesh(SPH_LO, solid(['#b5793f', '#96602f', '#c98a52'][i % 3], { rough: 0.85 }),
        [0.075, 0.055, 0.075], [Math.cos(a) * r, 0.16 + Math.random() * 0.06, Math.sin(a) * r], false));
    }
    kib.visible = false;
    g.add(kib);
    g.userData.kibble = kib;
  }
  g.userData.pick = { type: 'bowl', kind };
  return g;
}

/* ---------------- 浴缸 ---------------- */
export function buildTub() {
  const g = new THREE.Group();
  const w = glossy('#ffffff', { rough: 0.18 });
  const R = 1.5;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.9, 1.0, 26, 1, true), w);
  wall.material.side = THREE.DoubleSide;
  wall.position.y = 0.5; wall.castShadow = true; wall.receiveShadow = true;
  g.add(wall);
  g.add(mesh(CYL, glossy('#e8f4f8', { rough: 0.3 }), [R * 0.9, 0.08, R * 0.9], [0, 0.06, 0], false));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.1, 8, 28), glossy('#f6fbfd', { rough: 0.2 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 1.0; rim.castShadow = true;
  g.add(rim);
  // 水
  const water = mesh(CYL, new THREE.MeshStandardMaterial({
    color: '#7fd0ee', roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.72,
  }), [R * 0.92, 0.3, R * 0.92], [0, 0.42, 0], false);
  g.add(water);
  g.userData.water = water;
  // 小黄鸭
  const d = new THREE.Group();
  d.position.set(0.85, 0.62, 0.5);
  d.add(mesh(SPH_LO, solid('#ffd45e', { rough: 0.5 }), [0.26, 0.21, 0.3], [0, 0, 0]));
  d.add(mesh(SPH_LO, solid('#ffd45e', { rough: 0.5 }), [0.15, 0.15, 0.15], [0, 0.21, 0.19]));
  const beak = mesh(CONE, solid('#f08a3c', { rough: 0.5 }), [0.06, 0.14, 0.06], [0, 0.19, 0.33]);
  beak.rotation.x = Math.PI / 2;
  d.add(beak);
  for (const s of [-1, 1]) d.add(mesh(SPH_LO, solid('#221a14', { rough: 0.2 }), [0.03, 0.03, 0.03], [s * 0.06, 0.25, 0.28], false));
  g.add(d);
  g.userData.duck = d;
  // 脚
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.78;
    g.add(mesh(CYL, glossy('#dfe8ee', { rough: 0.3 }), [0.1, 0.16, 0.1],
      [Math.cos(a) * R * 0.7, 0.08, Math.sin(a) * R * 0.7]));
  }
  return g;
}

/* ---------------- 家具 ---------------- */
export function buildFurni(kind) {
  const g = new THREE.Group();
  if (kind === 'bed') {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.34, 10, 26), plainFur('#e8a0b4', 0.95));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.34; rim.castShadow = true; rim.receiveShadow = true;
    g.add(rim);
    const pad = mesh(CYL, plainFur('#fff0e0', 0.98), [1.02, 0.14, 1.02], [0, 0.22, 0]);
    pad.receiveShadow = true;
    g.add(pad);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26;
      g.add(mesh(SPH_LO, plainFur('#ffd9e2', 0.98), [0.3, 0.07, 0.3], [Math.cos(a) * 0.5, 0.3, Math.sin(a) * 0.5], false));
    }
  } else if (kind === 'cushion') {
    const c = mesh(CYL, plainFur('#a8cfe8', 0.98), [0.85, 0.24, 0.85], [0, 0.2, 0]);
    g.add(c);
    const top = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.2, 8, 22), plainFur('#8fc0e0', 0.98));
    top.rotation.x = Math.PI / 2; top.position.y = 0.3; top.castShadow = true;
    g.add(top);
    g.add(mesh(SPH_LO, plainFur('#7fb2d8', 0.98), [0.12, 0.06, 0.12], [0, 0.32, 0], false));
  } else if (kind === 'ball') {
    const b = mesh(SPH, glossy('#ff8fa3', { rough: 0.28 }), [0.34, 0.34, 0.34], [0, 0.34, 0]);
    g.add(b);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 8, 24), glossy(['#fff5e8', '#8fc7e8', '#ffd766'][i], { rough: 0.28 }));
      s.rotation.y = i * 0.9; s.rotation.x = 0.3 + i * 0.5;
      s.position.y = 0.34;
      g.add(s);
    }
  } else if (kind === 'yarn') {
    g.add(mesh(SPH, plainFur('#c9a6ee', 0.95), [0.32, 0.32, 0.32], [0, 0.32, 0]));
    for (let i = 0; i < 6; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 22), plainFur('#b48ce0', 0.95));
      t.rotation.set(i * 0.5, i * 1.1, i * 0.7);
      t.position.y = 0.32;
      g.add(t);
    }
  } else if (kind === 'bone') {
    const m = solid('#fff3dd', { rough: 0.55 });
    const b = mesh(CYL, m, [0.11, 0.62, 0.11], [0, 0.16, 0]);
    b.rotation.z = Math.PI / 2;
    g.add(b);
    for (const s of [-1, 1]) {
      g.add(mesh(SPH_LO, m, [0.14, 0.14, 0.14], [s * 0.34, 0.16, 0.09]));
      g.add(mesh(SPH_LO, m, [0.14, 0.14, 0.14], [s * 0.34, 0.16, -0.09]));
    }
  } else if (kind === 'plant') {
    g.add(mesh(CONE, solid('#e08a5a', { rough: 0.7 }), [0.45, 0.6, 0.45], [0, 0.3, 0]));
    g.children[0].rotation.x = Math.PI;
    g.add(mesh(CYL, solid('#c9743f', { rough: 0.7 }), [0.48, 0.1, 0.48], [0, 0.58, 0]));
    g.add(mesh(CYL, solid('#5a4030', { rough: 1 }), [0.4, 0.06, 0.4], [0, 0.62, 0], false));
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9, r = 0.28 + (i % 3) * 0.1;
      const leaf = mesh(SPH_LO, solid(['#5aa84a', '#6fbb55', '#4d9642'][i % 3], { rough: 0.9 }),
        [0.13, 0.32, 0.26], [Math.cos(a) * r, 0.95 + (i % 3) * 0.22, Math.sin(a) * r]);
      leaf.rotation.set(Math.cos(a) * 0.4, a, Math.sin(a) * 0.4);
      g.add(leaf);
    }
  } else if (kind === 'lamp') {
    g.add(mesh(CYL, solid('#8d6239', { rough: 0.6 }), [0.34, 0.08, 0.34], [0, 0.05, 0]));
    g.add(mesh(CYL, solid('#c9a06a', { rough: 0.5 }), [0.07, 1.5, 0.07], [0, 0.8, 0]));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.6, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#ffe0a8', roughness: 0.7, side: THREE.DoubleSide,
        emissive: 0xffc46a, emissiveIntensity: 0.55,
      }));
    shade.position.y = 1.75; shade.castShadow = false;
    g.add(shade);
    const light = new THREE.PointLight(0xffc987, 0, 6.5, 2);
    light.position.set(0, 1.6, 0);
    g.add(light);
    g.userData.lamp = light;
  } else if (kind === 'frame') {
    g.add(mesh(BOX, solid('#c98a52', { rough: 0.6 }), [1.3, 1.05, 0.1], [0, 0, 0], false));
    g.add(mesh(BOX, solid('#fff7ea', { rough: 0.7 }), [1.05, 0.8, 0.06], [0, 0, 0.06], false));
    const heart = new THREE.Group();
    heart.position.set(0, 0.02, 0.11);
    for (const s of [-1, 1]) heart.add(mesh(SPH_LO, solid('#f25d7e', { rough: 0.6 }), [0.17, 0.17, 0.04], [s * 0.13, 0.11, 0], false));
    const tip = mesh(CONE, solid('#f25d7e', { rough: 0.6 }), [0.24, 0.3, 0.05], [0, -0.13, 0], false);
    tip.rotation.x = Math.PI;
    heart.add(tip);
    g.add(heart);
  }
  return g;
}

/* ---------------- 服饰 ---------------- */
export function buildCloth(id, s, pet) {
  const g = new THREE.Group();
  const S = s / 0.42;                       // 相对基准头围缩放
  g.scale.setScalar(S);
  if (id === 'bow') {
    const m = glossy('#f25d7e', { rough: 0.3 });
    for (const d of [-1, 1]) {
      const w = mesh(CONE, m, [0.13, 0.2, 0.09], [d * 0.16, 0.03, 0.06], false);
      w.rotation.z = d * Math.PI / 2;
      g.add(w);
    }
    g.add(mesh(SPH_LO, glossy('#ff9db5', { rough: 0.3 }), [0.07, 0.07, 0.07], [0, 0.03, 0.06], false));
    g.position.set(s * 0.5, 0, 0);
    return { slot: 'head', obj: g };
  }
  if (id === 'strawhat') {
    g.add(mesh(CYL, solid('#f2d18b', { rough: 0.85 }), [0.46, 0.03, 0.46], [0, 0.05, 0], false));
    g.add(mesh(CYL, solid('#f6d795', { rough: 0.85 }), [0.26, 0.2, 0.26], [0, 0.18, 0], false));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 6, 20), solid('#e8666f', { rough: 0.7 }));
    band.rotation.x = Math.PI / 2; band.position.y = 0.11;
    g.add(band);
    g.position.y = 0.02;
    return { slot: 'head', obj: g };
  }
  if (id === 'partyhat') {
    g.add(mesh(CONE, solid('#8fc7e8', { rough: 0.5 }), [0.26, 0.62, 0.26], [0, 0.3, 0], false));
    g.add(mesh(SPH_LO, solid('#ff8fa3', { rough: 0.5 }), [0.1, 0.1, 0.1], [0, 0.64, 0], false));
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      g.add(mesh(SPH_LO, solid(['#ffd766', '#f2a0c4'][i % 2], { rough: 0.5 }), [0.045, 0.045, 0.045],
        [Math.cos(a) * 0.19, 0.18 + (i % 3) * 0.14, Math.sin(a) * 0.19], false));
    }
    g.rotation.z = 0.22;
    return { slot: 'head', obj: g };
  }
  if (id === 'flower') {
    const cols = ['#ff9db5', '#ffd766', '#a8d8f0'];
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const f = new THREE.Group();
      f.position.set(Math.cos(a) * 0.46, 0.02, Math.sin(a) * 0.46);
      for (let k = 0; k < 5; k++) {
        const pa = k / 5 * Math.PI * 2;
        f.add(mesh(SPH_LO, solid(cols[i % 3], { rough: 0.7 }), [0.055, 0.03, 0.055],
          [Math.cos(pa) * 0.06, 0, Math.sin(pa) * 0.06], false));
      }
      f.add(mesh(SPH_LO, solid('#fff8e0', { rough: 0.6 }), [0.035, 0.03, 0.035], [0, 0.015, 0], false));
      g.add(f);
    }
    g.position.y = -s * 0.15;
    return { slot: 'head', obj: g };
  }
  if (id === 'scarf') {
    const m = plainFur('#e8575f', 0.95);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.11, 8, 22), m);
    ring.rotation.x = Math.PI / 2 - 0.25; ring.castShadow = true;
    g.add(ring);
    const tail = mesh(BOX, m, [0.15, 0.38, 0.08], [0.11, -0.24, 0.16]);
    tail.rotation.z = 0.18;
    g.add(tail);
    g.add(mesh(BOX, plainFur('#f2b3b6', 0.95), [0.16, 0.07, 0.09], [0.13, -0.43, 0.16], false));
    return { slot: 'neck', obj: g };
  }
  if (id === 'bowtie') {
    const m = glossy('#5b79c9', { rough: 0.3 });
    for (const d of [-1, 1]) {
      const w = mesh(CONE, m, [0.11, 0.17, 0.08], [d * 0.14, 0, 0.28], false);
      w.rotation.z = d * Math.PI / 2;
      g.add(w);
    }
    g.add(mesh(BOX, glossy('#7c96dd', { rough: 0.3 }), [0.09, 0.11, 0.09], [0, 0, 0.28], false));
    g.position.y = -s * 0.2;
    return { slot: 'neck', obj: g };
  }
  if (id === 'glasses') {
    const fm = glossy('#7a5a3a', { rough: 0.3, metal: 0.4 });
    const lens = new THREE.MeshStandardMaterial({
      color: '#cfeaff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35,
    });
    for (const d of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 7, 18), fm);
      r.position.set(d * 0.19, 0, 0.02);
      g.add(r);
      g.add(mesh(CYL, lens, [0.16, 0.012, 0.16], [d * 0.19, 0, 0.02], false));
      g.children[g.children.length - 1].rotation.x = Math.PI / 2;
      const arm = mesh(CYL, fm, [0.016, 0.24, 0.016], [d * 0.3, 0.02, -0.12], false);
      arm.rotation.set(Math.PI / 2, 0, d * 0.35);
      g.add(arm);
    }
    g.add(mesh(CYL, fm, [0.016, 0.09, 0.016], [0, 0, 0.02], false));
    g.children[g.children.length - 1].rotation.z = Math.PI / 2;
    return { slot: 'face', obj: g };
  }
  if (id === 'wings') {
    const m = new THREE.MeshStandardMaterial({
      color: '#fffdf6', roughness: 0.6, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
    });
    for (const d of [-1, 1]) {
      const w = new THREE.Group();
      w.position.set(d * 0.14, 0.05, -0.04);
      w.rotation.set(0.25, d * 0.6, d * -0.22);
      w.scale.setScalar(0.66);
      for (let i = 0; i < 3; i++) {
        const f = mesh(SPH_LO, m, [0.14 - i * 0.02, 0.42 - i * 0.07, 0.03],
          [d * (0.12 + i * 0.1), 0.3 - i * 0.12, 0], false);
        f.rotation.z = d * (0.3 + i * 0.25);
        w.add(f);
      }
      g.add(w);
      if (pet) (pet.wingParts = pet.wingParts || []).push(w);
    }
    return { slot: 'back', obj: g };
  }
  return null;
}

export { mesh as _mesh };
