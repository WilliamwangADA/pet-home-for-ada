/* ============ 3D 光照渲染系统 ============
   统一的打光模型，让矢量角色/家具呈现真实的体积感：
   主光(左上) → 亮面 / 中间调 / 核心暗部 → 地面反弹光 → 右下轮廓光 → 高光 → 接触阴影
   全部用 SVG 渐变+滤镜实现，无图片、无 WebGL，iPad 上依然秒开。            */

/* 光源方向（归一化到 0~1 的渐变焦点位置） */
export const LIGHT = { fx: '34%', fy: '22%' };

/* 颜色工具：把 hex 提亮/压暗/混合，用来自动推导整套明暗阶 */
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
function rgb2hex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('');
}
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export function lighten(c, t) { return mix(c, '#ffffff', t); }
export function darken(c, t) { return mix(c, '#2a1a10', t); }
/* 暗部：压暗但**保持饱和**（乘法压暗 + 极轻微冷偏），绝不往灰紫里混，否则整只变脏 */
export function shadowTone(c, t) {
  const [r, g, b] = hex2rgb(c);
  const f = 1 - t * 0.52;
  return rgb2hex(r * f, g * f * 0.995, b * f + t * 16);
}
/* 亮部偏暖 */
export function lightTone(c, t) { return mix(c, '#fff8e2', t); }

/* 一整套球体/软体材质渐变：主体、暗部、反弹光、轮廓光 */
export function bodyMat(id, base, opts = {}) {
  const hi = lightTone(base, opts.hi ?? 0.42);
  const mid = base;
  const core = shadowTone(base, opts.core ?? 0.22);
  const deep = shadowTone(base, opts.deep ?? 0.38);
  const bounce = mix(base, opts.bounceColor || '#ffd9a8', 0.5);
  const rim = lightTone(base, 0.75);
  return `
  <radialGradient id="${id}" cx="${opts.fx || LIGHT.fx}" cy="${opts.fy || LIGHT.fy}" r="${opts.r || '86%'}">
    <stop offset="0%" stop-color="${hi}"/>
    <stop offset="26%" stop-color="${lightTone(base, 0.16)}"/>
    <stop offset="52%" stop-color="${mid}"/>
    <stop offset="84%" stop-color="${core}"/>
    <stop offset="100%" stop-color="${deep}"/>
  </radialGradient>
  <radialGradient id="${id}-bounce" cx="48%" cy="98%" r="46%">
    <stop offset="0%" stop-color="${bounce}" stop-opacity=".5"/>
    <stop offset="100%" stop-color="${bounce}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${id}-rim" x1="0" y1="0" x2=".85" y2="1">
    <stop offset="0%" stop-color="${rim}" stop-opacity="0"/>
    <stop offset="70%" stop-color="${rim}" stop-opacity="0"/>
    <stop offset="92%" stop-color="${rim}" stop-opacity=".42"/>
    <stop offset="100%" stop-color="${rim}" stop-opacity=".62"/>
  </linearGradient>
  <radialGradient id="${id}-ao" cx="50%" cy="48%" r="52%">
    <stop offset="0%" stop-color="${deep}" stop-opacity="0"/>
    <stop offset="80%" stop-color="${deep}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${deep}" stop-opacity=".28"/>
  </radialGradient>`;
}

/* 布/毛绒等次表面材质（肚兜、脸颊等浅色区），暗部更柔和 */
export function softMat(id, base, opts = {}) {
  return `
  <radialGradient id="${id}" cx="${opts.fx || '40%'}" cy="${opts.fy || '20%'}" r="${opts.r || '80%'}">
    <stop offset="0%" stop-color="${lightTone(base, 0.45)}"/>
    <stop offset="46%" stop-color="${base}"/>
    <stop offset="100%" stop-color="${shadowTone(base, 0.24)}"/>
  </radialGradient>`;
}

/* 光泽材质（铃铛、球、金属、塑料），带锐利高光 */
export function glossMat(id, base) {
  return `
  <radialGradient id="${id}" cx="32%" cy="26%" r="82%">
    <stop offset="0%" stop-color="${lighten(base, 0.75)}"/>
    <stop offset="22%" stop-color="${lighten(base, 0.28)}"/>
    <stop offset="62%" stop-color="${base}"/>
    <stop offset="100%" stop-color="${darken(base, 0.32)}"/>
  </radialGradient>`;
}

/* 三面体材质：家具的顶/前/侧，用同一底色推出方向光 */
export function solidMat(id, base) {
  return `
  <linearGradient id="${id}-top" x1="0" y1="0" x2=".6" y2="1">
    <stop offset="0%" stop-color="${lightTone(base, 0.5)}"/>
    <stop offset="100%" stop-color="${lightTone(base, 0.22)}"/>
  </linearGradient>
  <linearGradient id="${id}-front" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${base}"/>
    <stop offset="100%" stop-color="${shadowTone(base, 0.3)}"/>
  </linearGradient>
  <linearGradient id="${id}-side" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${shadowTone(base, 0.22)}"/>
    <stop offset="100%" stop-color="${shadowTone(base, 0.42)}"/>
  </linearGradient>`;
}

/* 共享滤镜：柔和投影 / 接触阴影 / 内阴影（体积凹陷） */
export function sharedDefs() {
  return `
  <filter id="f-soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="5"/>
  </filter>
  <filter id="f-soft2" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="11"/>
  </filter>
  <filter id="f-drop" x="-45%" y="-45%" width="190%" height="200%">
    <feDropShadow dx="5" dy="12" stdDeviation="9" flood-color="#7a4a20" flood-opacity=".3"/>
  </filter>
  <filter id="f-drop-s" x="-45%" y="-45%" width="190%" height="200%">
    <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#7a4a20" flood-opacity=".28"/>
  </filter>
  <radialGradient id="g-contact">
    <stop offset="0%" stop-color="#5c3312" stop-opacity=".42"/>
    <stop offset="60%" stop-color="#5c3312" stop-opacity=".2"/>
    <stop offset="100%" stop-color="#5c3312" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="g-glass" x1="0" y1="0" x2=".4" y2="1">
    <stop offset="0%" stop-color="#fff" stop-opacity=".85"/>
    <stop offset="55%" stop-color="#fff" stop-opacity=".12"/>
    <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>`;
}

/* 地面接触阴影：椭圆 + 模糊，跟随体积 */
export function contactShadow(cx, cy, rx, ry, op = 1) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g-contact)" opacity="${op}"/>`;
}

/* 高光斑：给球面加湿润的反射点 */
export function specular(cx, cy, rx, ry, rot = -20, op = 0.55) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}"
    transform="rotate(${rot} ${cx} ${cy})" filter="url(#f-soft)"/>`;
}
