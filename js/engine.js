/* ============ 3D 引擎层：渲染器 / 相机 / 光照 / 拾取 / 主循环 ============ */
import * as THREE from './vendor/three.module.min.js';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);

export let renderer = null;
let canvas, tickFns = [], running = false, lastT = 0;

/* 相机机位：家里 / 公园 各一套，支持轻微环视 */
const RIGS = {
  home: { pos: new THREE.Vector3(0, 5.3, 9.4), look: new THREE.Vector3(0, 1.0, -0.1), fov: 36 },
  park: { pos: new THREE.Vector3(0, 6.2, 12.0), look: new THREE.Vector3(0, 0.9, -0.6), fov: 38 },
};
let rig = RIGS.home;
let orbit = 0, orbitTarget = 0;          // 水平环视（弧度，限幅）
const ORBIT_MAX = 0.30;

/* ---- 灯光 ---- */
export const hemi = new THREE.HemisphereLight(0xffe7cd, 0x6d5340, 1.05);
export const sun = new THREE.DirectionalLight(0xfff1dc, 2.0);
export const fill = new THREE.DirectionalLight(0xbfd8ff, 0.45);
export const moon = new THREE.DirectionalLight(0x9fb6ff, 0.0);

/* 昼夜混合系数 0=白天 1=夜晚 */
let nightMix = 0, nightTarget = 0;

export function initEngine() {
  canvas = document.getElementById('stage');
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
    preserveDrawingBuffer: MAXF > 0,        // 仅调试截图时开，正常游玩不付这个代价
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.background = new THREE.Color(0xf6dfc4);
  scene.fog = new THREE.Fog(0xf6dfc4, 20, 42);

  sun.position.set(5.5, 10.5, 6.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 34;
  const d = 11;
  Object.assign(sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0012;
  sun.shadow.normalBias = 0.028;

  fill.position.set(-6, 5, 4);
  moon.position.set(-4, 9, 5);

  scene.add(hemi, sun, fill, moon, sun.target);

  resize();
  addEventListener('resize', resize);
  applyRig(true);
  return renderer;
}

export function resize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h;
  /* 竖屏 iPad：视野收窄会切掉宠物，按宽高比补偿 fov */
  const base = rig.fov;
  camera.fov = camera.aspect < 1 ? Math.min(60, base / camera.aspect * 0.86) : base;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

export function setRig(name) {
  rig = RIGS[name] || RIGS.home;
  orbit = orbitTarget = 0;
  resize();
  applyRig(true);
}

function applyRig(instant) {
  const a = orbit;
  const p = rig.pos;
  const x = p.x * Math.cos(a) + p.z * Math.sin(a);
  const z = -p.x * Math.sin(a) + p.z * Math.cos(a);
  if (instant) camera.position.set(x, p.y, z);
  else camera.position.lerp(new THREE.Vector3(x, p.y, z), 0.09);
  camera.lookAt(rig.look);
}

/* 拖背景轻微环视，给"这是 3D"的直观反馈 */
export function nudgeOrbit(dx) {
  orbitTarget = THREE.MathUtils.clamp(orbitTarget + dx * 0.0022, -ORBIT_MAX, ORBIT_MAX);
}
export function releaseOrbit() { orbitTarget *= 0.35; }

/* ---- 昼夜 ---- */
export function setNight(on) { nightTarget = on ? 1 : 0; }
const DAY = { hemiSky: 0xffe7cd, hemiGnd: 0x6d5340, hemiI: 1.05, sunI: 2.0, fillI: 0.45, moonI: 0.0, bg: 0xf6dfc4, exp: 1.06 };
const NIGHT = { hemiSky: 0x3a4a80, hemiGnd: 0x241f2e, hemiI: 0.40, sunI: 0.10, fillI: 0.10, moonI: 0.85, bg: 0x1a2144, exp: 0.94 };
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function applyNight() {
  const t = nightMix;
  hemi.color.setHex(DAY.hemiSky).lerp(_c1.setHex(NIGHT.hemiSky), t);
  hemi.groundColor.setHex(DAY.hemiGnd).lerp(_c1.setHex(NIGHT.hemiGnd), t);
  hemi.intensity = DAY.hemiI + (NIGHT.hemiI - DAY.hemiI) * t;
  sun.intensity = DAY.sunI + (NIGHT.sunI - DAY.sunI) * t;
  fill.intensity = DAY.fillI + (NIGHT.fillI - DAY.fillI) * t;
  moon.intensity = DAY.moonI + (NIGHT.moonI - DAY.moonI) * t;
  renderer.toneMappingExposure = DAY.exp + (NIGHT.exp - DAY.exp) * t;
  _c2.setHex(DAY.bg).lerp(_c1.setHex(NIGHT.bg), t);
  scene.background.copy(_c2);
  if (scene.fog) scene.fog.color.copy(_c2);
}

/* ---- 拾取 ---- */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit = new THREE.Vector3();

function toNdc(cx, cy) {
  ndc.x = (cx / innerWidth) * 2 - 1;
  ndc.y = -(cy / innerHeight) * 2 + 1;
  return ndc;
}

/** 屏幕坐标 → 地面(y=0)交点，返回 {x,z} 或 null */
export function groundAt(cx, cy) {
  ray.setFromCamera(toNdc(cx, cy), camera);
  const p = ray.ray.intersectPlane(groundPlane, _hit);
  return p ? { x: p.x, z: p.z } : null;
}

/** 射线拾取，返回第一个带 userData.pick 的祖先对象 */
export function pickAt(cx, cy, roots) {
  ray.setFromCamera(toNdc(cx, cy), camera);
  const hits = ray.intersectObjects(roots, true);
  for (const h of hits) {
    let o = h.object;
    while (o) {
      if (o.userData && o.userData.pick) return { target: o, point: h.point, distance: h.distance };
      o = o.parent;
    }
  }
  return null;
}

/** 世界坐标 → 屏幕像素（给 DOM 特效层用） */
const _v = new THREE.Vector3();
export function toScreen(pos, out = {}) {
  _v.copy(pos).project(camera);
  out.x = (_v.x * 0.5 + 0.5) * innerWidth;
  out.y = (-_v.y * 0.5 + 0.5) * innerHeight;
  return out;
}

/* ---- 主循环 ---- */
export function onTick(fn) { tickFns.push(fn); return () => { tickFns = tickFns.filter(f => f !== fn); }; }

/* 调试用（正常游玩不带这些参数）：
   ?maxframes=N  只渲染 N 帧后停手，免得软件渲染跑不完
   ?after=MS     前 MS 毫秒只跑逻辑不出图，用来等场景切换完成再开始计帧 */
const _qs = new URLSearchParams(location.search);
const MAXF = +(_qs.get('maxframes') || 0);
const AFTER = +(_qs.get('after') || 0);
let frames = 0;

export function start() {
  if (running) return;
  running = true;
  const loop = (t) => {
    const warmup = AFTER && t < AFTER;
    if (MAXF && !warmup && ++frames > MAXF) return;
    requestAnimationFrame(loop);
    const dt = Math.min((t - lastT) / 1000, 0.05) || 0.016;
    lastT = t;
    orbit += (orbitTarget - orbit) * 0.12;
    applyRig(false);
    nightMix += (nightTarget - nightMix) * 0.045;
    applyNight();
    try {
      for (const f of tickFns) f(dt, t / 1000);
    } catch (e) { console.error('tick error', e); }
    if (!warmup) renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
}

/* ---- 缩略图快照（给 HUD 头像 / 商店图标用，只在启动时跑几次）---- */
let thumbR = null;
export function snapshot(obj, size = 168, camPos = [0, 1.1, 3.4], look = [0, 0.85, 0], fov = 30) {
  if (!thumbR) {
    thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbR.setPixelRatio(1);
    thumbR.outputColorSpace = THREE.SRGBColorSpace;
    thumbR.toneMapping = THREE.ACESFilmicToneMapping;
    thumbR.toneMappingExposure = 1.12;
  }
  thumbR.setSize(size, size, false);
  const s = new THREE.Scene();
  const c = new THREE.PerspectiveCamera(fov, 1, 0.1, 40);
  c.position.set(...camPos); c.lookAt(...look);
  const h = new THREE.HemisphereLight(0xffeede, 0x8a7060, 1.5);
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(2.5, 4, 3.5);
  s.add(h, k, obj);
  thumbR.render(s, c);
  const url = thumbR.domElement.toDataURL('image/png');
  s.remove(obj);
  return url;
}
/* 调试用：强制立即渲染一帧（无头环境 rAF 可能被拖慢到没跑够） */
export function renderNow() { renderer.render(scene, camera); }

export function disposeThumb() { if (thumbR) { thumbR.dispose(); thumbR = null; } }

export { THREE };
