/* ============ 材质层：程序化贴图（毛发 / 花纹 / 木地板 / 草地）============
   全部用 canvas 现场生成，零图片请求，保持首包体积。 */
import { THREE } from './engine.js';

const cv = (w, h = w) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};
const tex = (canvas, rep = 1, srgb = true) => {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/* ---------------- 毛发微观噪声（做粗糙度 + 起伏）---------------- */
let _fuzz = null;
function fuzzTex() {
  if (_fuzz) return _fuzz;
  const S = 256, c = cv(S), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
  // 短毛纤维：大量细短线
  for (let i = 0; i < 5200; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const a = (Math.random() - 0.5) * 0.9 + Math.PI / 2;
    const len = 3 + Math.random() * 7;
    const g = Math.random() < 0.5 ? 90 + Math.random() * 45 : 150 + Math.random() * 60;
    x.strokeStyle = `rgb(${g},${g},${g})`;
    x.lineWidth = 0.7 + Math.random() * 0.9;
    x.beginPath(); x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
    x.stroke();
  }
  _fuzz = tex(c, 4, false);
  return _fuzz;
}

/* ---------------- 毛色贴图 ---------------- */
function softBlob(x, cx, cy, rx, ry, color, rot = 0) {
  x.save();
  x.translate(cx, cy); x.rotate(rot);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
  g.addColorStop(0, color);
  g.addColorStop(0.72, color);
  g.addColorStop(1, color + '00');
  x.fillStyle = g;
  x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, 7); x.fill();
  x.restore();
}

/* part: 'body' | 'head' | 'limb' */
function peltCanvas(breed, part) {
  const S = 512, H = 256;
  const c = cv(S, H), x = c.getContext('2d');
  const { coat, pattern } = breed;
  x.fillStyle = coat.base; x.fillRect(0, 0, S, H);

  // 背脊压深、腹部提亮（uv.y: 0=顶部脊背, 1=底部腹部）
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, coat.shade + 'cc');
  g.addColorStop(0.34, coat.shade + '22');
  g.addColorStop(0.62, '#ffffff00');
  g.addColorStop(1, coat.belly + 'ee');
  x.fillStyle = g; x.fillRect(0, 0, S, H);

  const type = pattern.type;
  if (type === 'tabby') {
    const cS = pattern.colors[0];
    x.globalAlpha = 0.85;
    const nStripe = part === 'head' ? 9 : 22;      // 头上条纹太密会看成长发
    for (let i = 0; i < nStripe; i++) {
      const px = (i / nStripe) * S + Math.sin(i * 2.3) * 6;
      const w = 8 + (i % 3) * 5;
      x.fillStyle = cS;
      x.beginPath();
      x.moveTo(px, 0);
      const yEnd = H * (part === 'head' ? 0.42 : 0.72);
      for (let y = 0; y <= yEnd; y += 16) x.lineTo(px + Math.sin(y * 0.05 + i) * 7, y);
      for (let y = yEnd; y >= 0; y -= 16) x.lineTo(px + w + Math.sin(y * 0.05 + i) * 7, y);
      x.closePath(); x.fill();
    }
    // 背脊深色带
    x.fillStyle = cS; x.globalAlpha = 0.6;
    x.fillRect(0, 0, S, H * 0.14);
    x.globalAlpha = 1;
  } else if (type === 'patches') {
    const [c1, c2] = pattern.colors;
    const spots = part === 'head'
      ? [[110, 60, 70, 52, c1], [380, 70, 62, 48, c2]]
      : [[90, 66, 92, 62, c1], [250, 40, 74, 52, c2], [400, 96, 84, 60, c1], [180, 150, 56, 40, c2]];
    for (const [cx, cy, rx, ry, col] of spots) softBlob(x, cx, cy, rx, ry, col, 0.3);
  } else if (type === 'tuxedo') {
    /* 奶牛猫：整片黑背 + 白胸白口鼻。边缘只做很轻的起伏，
       起伏太大会沿球面 U 方向绕成一圈圈黑带（早先就是这样，像斑马）。 */
    const dk = pattern.colors[0];
    x.fillStyle = dk;
    x.beginPath();
    x.moveTo(0, 0); x.lineTo(S, 0); x.lineTo(S, H * 0.56);
    for (let i = S; i >= 0; i -= 32) x.lineTo(i, H * 0.56 + Math.sin(i * 0.012) * 7);
    x.closePath(); x.fill();
    if (part === 'head') {
      // 脸上留白：口鼻 + 眉心一道白
      softBlob(x, S * 0.5, H * 0.78, 118, 62, '#fbfbfb');
      softBlob(x, S * 0.5, H * 0.5, 30, 74, '#fbfbfb');
    } else {
      softBlob(x, S * 0.5, H * 0.82, 130, 54, '#fbfbfb');
    }
  } else if (type === 'blaze') {
    softBlob(x, S * 0.5, H * 0.86, 150, 60, '#fffaf1');
    if (part === 'head') softBlob(x, S * 0.5, H * 0.62, 44, 78, '#fffaf1');
  } else if (type === 'shiba') {
    softBlob(x, S * 0.5, H * 0.9, 170, 52, coat.belly);
    if (part === 'head') {
      softBlob(x, S * 0.36, H * 0.58, 52, 40, coat.belly);
      softBlob(x, S * 0.64, H * 0.58, 52, 40, coat.belly);
    }
  }

  // 细毛纹理叠加，避免塑料感
  x.globalAlpha = 0.10;
  for (let i = 0; i < 2600; i++) {
    const px = Math.random() * S, py = Math.random() * H;
    const a = Math.PI / 2 + (Math.random() - 0.5) * 0.7;
    const len = 4 + Math.random() * 9;
    x.strokeStyle = Math.random() < 0.5 ? '#000' : '#fff';
    x.lineWidth = 0.9;
    x.beginPath(); x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke();
  }
  x.globalAlpha = 1;
  return c;
}

const peltCache = new Map();
export function furMat(breedKey, breed, part = 'body') {
  const key = breedKey + ':' + part;
  if (peltCache.has(key)) return peltCache.get(key);
  const map = tex(peltCanvas(breed, part), 1);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.MeshStandardMaterial({
    map, roughness: 0.94, metalness: 0,
    roughnessMap: fuzzTex(), bumpMap: fuzzTex(), bumpScale: 0.035,
  });
  peltCache.set(key, m);
  return m;
}

/* 纯色毛（腿/耳内/尾尖等） */
export function plainFur(color, rough = 0.95) {
  return new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: 0,
    roughnessMap: fuzzTex(), bumpMap: fuzzTex(), bumpScale: 0.03,
  });
}

/* 绒毛外壳：背面渲染的一层半透明壳，做出毛茸茸的边缘 */
export function fuzzShell(color, strength = 0.4) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.10 + strength * 0.30,
    side: THREE.BackSide, depthWrite: false,
  });
}

/* ---------------- 通用材质 ---------------- */
export const solid = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, ...o.extra,
});
export const glossy = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, roughness: o.rough ?? 0.22, metalness: o.metal ?? 0.05, ...o.extra,
});

/* ---------------- 场景贴图 ---------------- */
let _wood = null;
export function woodTex() {
  if (_wood) return _wood;
  const S = 512, c = cv(S), x = c.getContext('2d');
  x.fillStyle = '#d9a771'; x.fillRect(0, 0, S, S);
  const planks = 6, ph = S / planks;
  for (let i = 0; i < planks; i++) {
    const tone = 0.86 + Math.random() * 0.26;
    x.fillStyle = `rgb(${Math.min(255, 217 * tone) | 0},${Math.min(255, 167 * tone) | 0},${Math.min(255, 113 * tone) | 0})`;
    x.fillRect(0, i * ph, S, ph - 2);
    x.strokeStyle = 'rgba(120,78,44,.42)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, i * ph + ph - 1); x.lineTo(S, i * ph + ph - 1); x.stroke();
    // 木纹
    x.globalAlpha = 0.16;
    for (let k = 0; k < 26; k++) {
      x.strokeStyle = k % 2 ? '#7a4c26' : '#f2cfa4';
      x.lineWidth = 0.8 + Math.random();
      x.beginPath();
      const y0 = i * ph + Math.random() * ph;
      x.moveTo(0, y0);
      for (let px = 0; px <= S; px += 32) x.lineTo(px, y0 + Math.sin(px * 0.02 + k) * 2.4);
      x.stroke();
    }
    x.globalAlpha = 1;
  }
  _wood = tex(c, 4);
  return _wood;
}

let _grass = null;
export function grassTex() {
  if (_grass) return _grass;
  const S = 256, c = cv(S), x = c.getContext('2d');
  x.fillStyle = '#8ac462'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 4200; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const g = ['#7cb955', '#9ad274', '#6faa4a', '#a8dd84'][(Math.random() * 4) | 0];
    x.strokeStyle = g; x.lineWidth = 1 + Math.random();
    x.beginPath(); x.moveTo(px, py);
    x.lineTo(px + (Math.random() - 0.5) * 4, py - 3 - Math.random() * 5); x.stroke();
  }
  _grass = tex(c, 14);
  return _grass;
}

let _rug = null;
export function rugTex() {
  if (_rug) return _rug;
  const S = 256, c = cv(S), x = c.getContext('2d');
  x.fillStyle = '#f6d9c4'; x.fillRect(0, 0, S, S);
  x.strokeStyle = '#eab9a0'; x.lineWidth = 10;
  for (let i = -S; i < S * 2; i += 46) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + S, S); x.stroke();
  }
  x.globalAlpha = 0.5;
  for (let i = 0; i < 3000; i++) {
    x.fillStyle = Math.random() < 0.5 ? '#fff' : '#d9a98f';
    x.fillRect(Math.random() * S, Math.random() * S, 1.6, 1.6);
  }
  _rug = tex(c, 1);
  return _rug;
}

let _wall = null;
export function wallTex() {
  if (_wall) return _wall;
  const S = 256, c = cv(S), x = c.getContext('2d');
  x.fillStyle = '#f7e3cd'; x.fillRect(0, 0, S, S);
  x.globalAlpha = 0.4;
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#e6cdb2';
    x.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  _wall = tex(c, 3);
  return _wall;
}
