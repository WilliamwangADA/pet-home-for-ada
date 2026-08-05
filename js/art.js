/* ============ 矢量美术 v4：3D 打光渲染 + 正/侧双视图 + 换装 ============ */
import { bodyMat, softMat, glossMat, solidMat, sharedDefs, contactShadow, specular,
         lighten, darken, mix, lightTone, shadowTone } from './shade.js';

export const BREEDS = {
  shiba: {
    kind: 'dog', label: '柴柴', main: '#f09f51', light: '#ffc180', deep: '#d9853c',
    cream: '#fff4e3', creamHi: '#fffdf6', earIn: '#c1753f',
    dark: '#5b3a29', collar: '#f25d7e', collarHi: '#ff8ba6', blush: '#ffb0ba',
    ear: 'point', tail: 'curl', brows: '#fff'
  },
  corgi: {
    kind: 'dog', label: '小柯基', main: '#f7b06b', light: '#ffd096', deep: '#e0914b',
    cream: '#fff8ee', creamHi: '#ffffff', earIn: '#e78a5a',
    dark: '#59372a', collar: '#5ba8de', collarHi: '#8cc6ec', blush: '#ffb9c0',
    ear: 'big', tail: 'nub', brows: '#fff', blaze: true
  },
  golden: {
    kind: 'dog', label: '小金毛', main: '#eec379', light: '#fadfa2', deep: '#d3a253',
    cream: '#fbf0d7', creamHi: '#fffcf2', earIn: '#d8a856',
    dark: '#5d4126', collar: '#7fc8a9', collarHi: '#a8dfc7', blush: '#ffc0b8',
    ear: 'floppy', tail: 'feather', brows: '#e8c887'
  },
  bichon: {
    kind: 'dog', label: '云朵犬', main: '#fdf9f2', light: '#ffffff', deep: '#eadbc8',
    cream: '#fffdf8', creamHi: '#ffffff', earIn: '#f0dfc9',
    dark: '#6b5138', collar: '#b28fd9', collarHi: '#cfb3ea', blush: '#ffb3bd',
    ear: 'puff', tail: 'puff', brows: null, outline: '#e5d3ba'
  },
  /* ---- 小猫 ---- */
  calico: {
    kind: 'cat', label: '三花猫', main: '#fff6ea', light: '#ffffff', deep: '#e8d8c4',
    cream: '#fffdf8', creamHi: '#ffffff', earIn: '#ffc0cb',
    dark: '#5b4636', collar: '#f25d7e', collarHi: '#ff8ba6', blush: '#ffb0ba',
    outline: '#e7d6c0', patch: [['#f0a04b', 'head-l'], ['#5b4636', 'head-r'], ['#f0a04b', 'back']]
  },
  orange: {
    kind: 'cat', label: '小橘猫', main: '#f7ab5c', light: '#ffca8e', deep: '#dd8f42',
    cream: '#fff2df', creamHi: '#fffbf3', earIn: '#f2a0a8',
    dark: '#5b3a29', collar: '#7fc8a9', collarHi: '#a8dfc7', blush: '#ffb0ba',
    stripes: '#e08a3c'
  },
  gray: {
    kind: 'cat', label: '灰灰猫', main: '#b9c4d2', light: '#dbe3ec', deep: '#95a3b5',
    cream: '#f3f6fa', creamHi: '#ffffff', earIn: '#f2b3c0',
    dark: '#4a5361', collar: '#5ba8de', collarHi: '#8cc6ec', blush: '#ffb9c8',
    stripes: '#9aa8b9'
  },
  tuxedo: {
    kind: 'cat', label: '奶牛猫', main: '#3d3a44', light: '#575263', deep: '#2b2932',
    cream: '#fffdf8', creamHi: '#ffffff', earIn: '#f2a0b4',
    dark: '#22212a', collar: '#ffd166', collarHi: '#ffe49a', blush: '#e58a9c',
    mask: true
  }
};

export const isCat = (breed) => BREEDS[breed] && BREEDS[breed].kind === 'cat';

/* ---------- 换装 ---------- */
export const CLOTHES = [
  { id: 'bow', name: '红蝴蝶结', price: 10, slot: 'head', icon: '🎀',
    front: `<g transform="translate(64,34) rotate(-18)">
      <path d="M0,0 Q-16,-12 -20,0 Q-16,12 0,0 Q16,-12 20,0 Q16,12 0,0 Z" fill="#f25d7e" stroke="#d63f60" stroke-width="2"/>
      <circle r="5" fill="#ffb0c4"/></g>`,
    side: `<g transform="translate(158,26) rotate(-14) scale(.85)">
      <path d="M0,0 Q-16,-12 -20,0 Q-16,12 0,0 Q16,-12 20,0 Q16,12 0,0 Z" fill="#f25d7e" stroke="#d63f60" stroke-width="2"/>
      <circle r="5" fill="#ffb0c4"/></g>` },
  { id: 'strawhat', name: '小草帽', price: 15, slot: 'head', icon: '👒',
    front: `<g transform="translate(100,26)">
      <ellipse rx="42" ry="12" fill="#f2d18b"/><ellipse rx="42" ry="12" cy="-2" fill="#f9e0a8"/>
      <path d="M-24,-4 Q-24,-30 0,-30 Q24,-30 24,-4 Q0,4 -24,-4 Z" fill="#f6d795"/>
      <path d="M-24,-6 Q0,2 24,-6 L24,-1 Q0,7 -24,-1 Z" fill="#e8666f"/></g>`,
    side: `<g transform="translate(168,16) scale(.85)">
      <ellipse rx="42" ry="12" fill="#f2d18b"/><ellipse rx="42" ry="12" cy="-2" fill="#f9e0a8"/>
      <path d="M-24,-4 Q-24,-30 0,-30 Q24,-30 24,-4 Q0,4 -24,-4 Z" fill="#f6d795"/>
      <path d="M-24,-6 Q0,2 24,-6 L24,-1 Q0,7 -24,-1 Z" fill="#e8666f"/></g>` },
  { id: 'partyhat', name: '派对帽', price: 15, slot: 'head', icon: '🥳',
    front: `<g transform="translate(132,28) rotate(16)">
      <path d="M0,-34 L-16,6 Q0,12 16,6 Z" fill="#8fc7e8"/>
      <path d="M0,-34 L-9,-11 Q0,-7 9,-11 Z" fill="#ffd766"/>
      <path d="M-13,-1 Q0,5 13,-1 L16,6 Q0,12 -16,6 Z" fill="#f2a0c4"/>
      <circle cy="-36" r="6" fill="#ff8fa3"/></g>`,
    side: `<g transform="translate(172,12) rotate(10) scale(.85)">
      <path d="M0,-34 L-16,6 Q0,12 16,6 Z" fill="#8fc7e8"/>
      <path d="M0,-34 L-9,-11 Q0,-7 9,-11 Z" fill="#ffd766"/>
      <circle cy="-36" r="6" fill="#ff8fa3"/></g>` },
  { id: 'flower', name: '小花环', price: 18, slot: 'head', icon: '🌸',
    front: (() => { let f = ''; for (let i = 0; i < 7; i++) { const x = -36 + i * 12, y = Math.abs(i - 3) * 2.2 - 2;
      const c = ['#ff9db5', '#ffd766', '#a8d8f0'][i % 3];
      f += `<g transform="translate(${x},${y})"><circle r="6.5" fill="${c}"/><circle r="2.6" fill="#fff8e0"/></g>`; }
      return `<g transform="translate(100,34)">${f}</g>`; })(),
    side: `<g transform="translate(166,20) scale(.8)"><circle cx="-20" cy="2" r="6.5" fill="#ff9db5"/><circle cx="-20" cy="2" r="2.6" fill="#fff8e0"/>
      <circle cx="-6" cy="-3" r="6.5" fill="#ffd766"/><circle cx="-6" cy="-3" r="2.6" fill="#fff8e0"/>
      <circle cx="8" cy="-3" r="6.5" fill="#a8d8f0"/><circle cx="8" cy="-3" r="2.6" fill="#fff8e0"/>
      <circle cx="22" cy="2" r="6.5" fill="#ff9db5"/><circle cx="22" cy="2" r="2.6" fill="#fff8e0"/></g>` },
  { id: 'scarf', name: '暖暖围巾', price: 15, slot: 'neck', icon: '🧣',
    front: `<g><path d="M46,158 Q100,182 154,158 L154,174 Q100,199 46,174 Z" fill="#e8575f"/>
      <path d="M46,163 Q100,187 154,163" stroke="#c93e46" stroke-width="3" fill="none"/>
      <path d="M64,172 L58,204 Q66,210 74,204 L76,176 Z" fill="#e8575f"/>
      <path d="M58,204 Q66,210 74,204 L74,210 Q66,216 58,210 Z" fill="#f2b3b6"/></g>`,
    side: `<g><path d="M128,96 Q152,108 176,98 L176,114 Q150,126 126,112 Z" fill="#e8575f"/>
      <path d="M136,112 L132,142 Q140,148 148,142 L148,116 Z" fill="#e8575f"/>
      <path d="M132,142 Q140,148 148,142 L148,148 Q140,154 132,148 Z" fill="#f2b3b6"/></g>` },
  { id: 'bowtie', name: '绅士领结', price: 10, slot: 'neck', icon: '🤵',
    front: `<g transform="translate(100,172)">
      <path d="M0,0 L-18,-9 L-18,9 Z" fill="#5b79c9"/><path d="M0,0 L18,-9 L18,9 Z" fill="#5b79c9"/>
      <rect x="-4.5" y="-5" width="9" height="10" rx="2.5" fill="#7c96dd"/></g>`,
    side: `<g transform="translate(152,116) scale(.8)">
      <path d="M0,0 L-18,-9 L-18,9 Z" fill="#5b79c9"/><path d="M0,0 L18,-9 L18,9 Z" fill="#5b79c9"/>
      <rect x="-4.5" y="-5" width="9" height="10" rx="2.5" fill="#7c96dd"/></g>` },
  { id: 'glasses', name: '圆圆眼镜', price: 12, slot: 'face', icon: '🤓',
    front: `<g fill="none" stroke="#7a5a3a" stroke-width="4">
      <circle cx="74" cy="93" r="14" fill="rgba(200,235,255,.35)"/>
      <circle cx="126" cy="93" r="14" fill="rgba(200,235,255,.35)"/>
      <path d="M88,93 Q100,87 112,93 M60,90 L46,84 M140,90 L154,84"/></g>`,
    side: null },
  { id: 'wings', name: '天使翅膀', price: 25, slot: 'back', icon: '👼',
    front: `<g><path d="M34,116 Q-8,84 6,52 Q22,60 26,74 Q22,50 40,42 Q48,58 44,76 Q52,60 62,64 Q60,92 44,110 Z" fill="#fffdf6" stroke="#e8dcc8" stroke-width="2.5"/>
      <path d="M166,116 Q208,84 194,52 Q178,60 174,74 Q178,50 160,42 Q152,58 156,76 Q148,60 138,64 Q140,92 156,110 Z" fill="#fffdf6" stroke="#e8dcc8" stroke-width="2.5"/></g>`,
    side: `<g transform="translate(96,58) rotate(-12)"><path d="M0,40 Q-42,8 -28,-24 Q-12,-16 -8,-2 Q-12,-26 6,-34 Q14,-18 10,0 Q18,-16 28,-12 Q26,16 10,34 Z" fill="#fffdf6" stroke="#e8dcc8" stroke-width="2.5"/></g>` },
];

function clothesLayer(equipped, view, slotFilter) {
  let s = '';
  for (const id of equipped || []) {
    const c = CLOTHES.find(x => x.id === id);
    if (!c || !c[view]) continue;
    const isBack = c.slot === 'back';
    if (slotFilter === 'back' ? !isBack : isBack) continue;
    s += c[view];
  }
  return s;
}

function earsF(k, b) {
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".45"`;
  if (b.ear === 'floppy') return `
    <g class="p-earL" data-part><path d="M42,44 Q18,52 22,96 Q24,120 44,116 Q60,112 58,80 Q56,54 42,44 Z" fill="url(#g-${k}-ear)" ${st}/></g>
    <g class="p-earR" data-part><path d="M158,44 Q182,52 178,96 Q176,120 156,116 Q140,112 142,80 Q144,54 158,44 Z" fill="url(#g-${k}-ear)" ${st}/></g>`;
  if (b.ear === 'puff') return `
    <g class="p-earL" data-part><circle cx="46" cy="46" r="22" fill="url(#g-${k}-body)" ${st}/><circle cx="34" cy="60" r="13" fill="url(#g-${k}-body)" ${st}/></g>
    <g class="p-earR" data-part><circle cx="154" cy="46" r="22" fill="url(#g-${k}-body)" ${st}/><circle cx="166" cy="60" r="13" fill="url(#g-${k}-body)" ${st}/></g>`;
  const big = b.ear === 'big';
  const tipY = big ? 4 : 16, sp = big ? 8 : 0;
  return `
    <g class="p-earL" data-part>
      <path d="M44,62 Q${34 - sp},${tipY + 12} ${58 - sp},${tipY} Q84,${tipY - 3} 88,48 Q66,60 44,62 Z" fill="url(#g-${k}-body)" ${st}/>
      <path d="M53,56 Q${47 - sp / 2},${tipY + 22} ${63 - sp / 2},${tipY + 12} Q78,${tipY + 10} 80,46 Q66,55 53,56 Z" fill="${b.earIn}"/>
    </g>
    <g class="p-earR" data-part>
      <path d="M156,62 Q${166 + sp},${tipY + 12} ${142 + sp},${tipY} Q116,${tipY - 3} 112,48 Q134,60 156,62 Z" fill="url(#g-${k}-body)" ${st}/>
      <path d="M147,56 Q${153 + sp / 2},${tipY + 22} ${137 + sp / 2},${tipY + 12} Q122,${tipY + 10} 120,46 Q134,55 147,56 Z" fill="${b.earIn}"/>
    </g>`;
}

function tailF(k, b) {
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3"` : '';
  if (b.tail === 'curl') return `<g class="p-tail" data-part>
      <circle cx="163" cy="118" r="18" fill="url(#g-${k}-body)"/><circle cx="168" cy="113" r="9.5" fill="${b.cream}"/></g>`;
  if (b.tail === 'nub') return `<ellipse class="p-tail" data-part cx="166" cy="138" rx="12" ry="10" fill="url(#g-${k}-body)"/>`;
  if (b.tail === 'puff') return `<g class="p-tail" data-part>
      <circle cx="164" cy="124" r="16" fill="url(#g-${k}-body)" ${st}/><circle cx="174" cy="113" r="9" fill="url(#g-${k}-body)" ${st}/></g>`;
  return `<g class="p-tail" data-part>
      <path d="M160,132 Q196,110 188,70" stroke="url(#g-${k}-body)" stroke-width="19" stroke-linecap="round" fill="none"/>
      <circle cx="187" cy="72" r="11" fill="${b.cream}"/></g>`;
}

/* 3D 打光材质组：主体球面 / 奶油腹面 / 项圈 / 耳内 / 铃铛 */
function defsFor(k, b) {
  return `<defs>
    ${sharedDefs()}
    ${bodyMat(`g-${k}-body`, b.main, { hi: 0.52, core: 0.32, deep: 0.5 })}
    ${softMat(`g-${k}-cream`, b.cream)}
    ${glossMat(`g-${k}-collar`, b.collar)}
    ${glossMat(`g-${k}-bell`, '#ffcf4d')}
    ${bodyMat(`g-${k}-ear`, b.earIn, { hi: 0.3, core: 0.3, deep: 0.44, fx: '46%', fy: '18%' })}
    <radialGradient id="g-${k}-eye" cx="34%" cy="28%" r="80%">
      <stop offset="0%" stop-color="${lighten(b.dark, 0.42)}"/>
      <stop offset="55%" stop-color="${b.dark}"/>
      <stop offset="100%" stop-color="${darken(b.dark, 0.4)}"/>
    </radialGradient>
    <radialGradient id="g-${k}-iris" cx="36%" cy="30%" r="78%">
      <stop offset="0%" stop-color="#9ee8bf"/><stop offset="52%" stop-color="#5fbf8f"/>
      <stop offset="100%" stop-color="#2f8a63"/>
    </radialGradient>
  </defs>`;
}

/* 体积叠层：反弹光 + 轮廓光 + 环境遮蔽，套在同一条身体路径上 */
function volume(k, d) {
  return `<path d="${d}" fill="url(#g-${k}-body-bounce)"/>
    <path d="${d}" fill="url(#g-${k}-body-ao)"/>
    <path d="${d}" fill="url(#g-${k}-body-rim)"/>`;
}

/* ================= 小猫：正面 ================= */
function catFrontSVG(breed, equipped) {
  const b = BREEDS[breed], k = breed;
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3.5"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".4"`;
  const stripes = b.stripes ? `
    <path d="M84,40 Q100,34 116,40" stroke="${b.stripes}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M74,52 Q100,44 126,52" stroke="${b.stripes}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M100,30 L100,46" stroke="${b.stripes}" stroke-width="5" stroke-linecap="round"/>
    <path d="M34,120 Q28,134 32,148" stroke="${b.stripes}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M166,120 Q172,134 168,148" stroke="${b.stripes}" stroke-width="7" fill="none" stroke-linecap="round"/>` : '';
  const patches = b.patch ? `
    <path d="M100,26 C74,26 52,50 44,84 Q62,66 100,62 Z" fill="#f0a04b" opacity=".95"/>
    <path d="M126,30 C142,42 152,62 156,86 Q140,68 118,64 Z" fill="#5b4636" opacity=".9"/>
    <ellipse cx="152" cy="130" rx="20" ry="30" fill="#f0a04b" opacity=".85" transform="rotate(-12 152 130)"/>` : '';
  const CBODY = 'M100,26 C56,26 32,70 30,122 C28,172 58,200 100,200 C142,200 172,172 170,122 C168,70 144,26 100,26 Z';
  const mask = b.mask ? `
    <path d="M100,72 C82,72 68,86 66,108 C64,140 78,196 100,196 C122,196 136,140 134,108 C132,86 118,72 100,72 Z" fill="${b.cream}"/>
    <ellipse cx="100" cy="104" rx="26" ry="20" fill="${b.cream}"/>` : '';
  return `<svg viewBox="0 0 200 212">
  ${defsFor(k, b)}
  <g class="flip">
  ${contactShadow(100, 202, 60, 11)}
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'front', 'back')}
    <g class="p-tail" data-part>
      <path d="M158,150 Q198,140 196,96 Q194,66 172,62" stroke="url(#g-${k}-body)" stroke-width="17"
        fill="none" stroke-linecap="round"/>
      ${b.stripes ? `<path d="M192,120 L200,118 M190,98 L198,94 M182,76 L188,70" stroke="${b.stripes}" stroke-width="6" stroke-linecap="round"/>` : ''}
      <circle cx="173" cy="62" r="9" fill="${b.cream}"/>
    </g>
    <g class="p-head" data-part>
      <g class="p-earL" data-part>
        <path d="M40,74 L44,14 Q46,4 56,10 L92,44 Q64,50 40,74 Z" fill="url(#g-${k}-body)" ${st}/>
        <path d="M52,62 L54,28 Q55,22 61,26 L80,46 Q64,50 52,62 Z" fill="${b.earIn}"/>
      </g>
      <g class="p-earR" data-part>
        <path d="M160,74 L156,14 Q154,4 144,10 L108,44 Q136,50 160,74 Z" fill="url(#g-${k}-body)" ${st}/>
        <path d="M148,62 L146,28 Q145,22 139,26 L120,46 Q136,50 148,62 Z" fill="${b.earIn}"/>
      </g>
    </g>
    <path d="${CBODY}" fill="url(#g-${k}-body)" ${st}/>
    ${volume(k, CBODY)}
    ${patches}
    <path d="M100,30 C72,30 50,56 46,90 Q74,72 100,72 Q126,72 154,90 C150,56 128,30 100,30 Z" fill="${b.light}" opacity=".3"/>
    ${mask}
    <path d="M100,88 C78,88 66,104 64,130 C62,166 78,196 100,196 C122,196 138,166 136,130 C134,104 122,88 100,88 Z"
      fill="url(#g-${k}-cream)" opacity="${b.mask ? 0 : 1}"/>
    ${stripes}
    <ellipse cx="32" cy="146" rx="10" ry="17" fill="url(#g-${k}-body)" ${st} transform="rotate(12 32 146)"/>
    <ellipse cx="168" cy="146" rx="10" ry="17" fill="url(#g-${k}-body)" ${st} transform="rotate(-12 168 146)"/>
    <path d="M44,166 Q100,188 156,166 L156,178 Q100,200 44,178 Z" fill="url(#g-${k}-collar)"/>
    <circle cx="100" cy="186" r="8.5" fill="#ffd766"/><circle cx="97" cy="183" r="3" fill="#fff2c0"/>
    <line x1="100" y1="182" x2="100" y2="189" stroke="#c99b1f" stroke-width="2"/>
    <ellipse cx="74" cy="197" rx="14" ry="8" fill="url(#g-${k}-cream)" ${st}/>
    <ellipse cx="126" cy="197" rx="14" ry="8" fill="url(#g-${k}-cream)" ${st}/>
    <path d="M70,194 v5 M78,194 v5 M122,194 v5 M130,194 v5" stroke="rgba(120,80,40,.22)" stroke-width="2" stroke-linecap="round"/>
    <g class="p-face" data-part>
      <g class="p-eyes-open" data-part>
        <ellipse cx="74" cy="96" rx="9.2" ry="10.7" fill="url(#g-${k}-iris)"/>
        <ellipse cx="74" cy="96" rx="3" ry="9" fill="${b.dark}"/>
        <circle cx="70.5" cy="91" r="3" fill="#fff"/><circle cx="77" cy="100" r="1.5" fill="#fff" opacity=".6"/>
        <ellipse cx="126" cy="96" rx="9.2" ry="10.7" fill="url(#g-${k}-iris)"/>
        <ellipse cx="126" cy="96" rx="3" ry="9" fill="${b.dark}"/>
        <circle cx="122.5" cy="91" r="3" fill="#fff"/><circle cx="129" cy="100" r="1.5" fill="#fff" opacity=".6"/>
      </g>
      <g class="p-eyes-happy" data-part fill="none" stroke="${b.dark}" stroke-width="5.5" stroke-linecap="round">
        <path d="M64,98 Q74,87 84,98"/><path d="M116,98 Q126,87 136,98"/>
      </g>
      <g class="p-eyes-sleep" data-part fill="none" stroke="${b.dark}" stroke-width="4.5" stroke-linecap="round">
        <path d="M66,96 Q74,102 82,96"/><path d="M118,96 Q126,102 134,96"/>
      </g>
      <ellipse cx="52" cy="114" rx="9" ry="5.5" fill="${b.blush}" opacity=".8"/>
      <ellipse cx="148" cy="114" rx="9" ry="5.5" fill="${b.blush}" opacity=".8"/>
      <path d="M92,112 L108,112 Q108,120 100,122 Q92,120 92,112 Z" fill="#f0899e"/>
      <path d="M100,122 L100,127 M87,131 Q94,137 100,127 Q106,137 113,131" fill="none" stroke="${b.dark}" stroke-width="3.2" stroke-linecap="round"/>
      <g stroke="${b.dark}" stroke-width="2.4" stroke-linecap="round" opacity=".55">
        <path d="M60,112 L28,104 M60,120 L26,120 M140,112 L172,104 M140,120 L174,120"/>
      </g>
      <path class="p-tongue" data-part d="M94,130 L106,130 Q106,141 100,141 Q94,141 94,130 Z" fill="#ff8fa3"/>
      ${clothesLayer(equipped, 'front', 'fore')}
    </g>
  </g></g></svg>`;
}

/* ================= 小猫：侧面 ================= */
function catSideSVG(breed, equipped) {
  const b = BREEDS[breed], k = breed + '-s';
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3.5"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".4"`;
  const CSBODY = 'M120,30 C78,28 46,54 44,96 C42,130 68,150 118,150 C168,152 200,130 198,90 C196,54 166,32 120,30 Z';
  const leg = (x, cls) => `<g class="sleg ${cls}" data-part>
      <path d="M${x - 8},120 L${x - 8},158 Q${x - 8},167 ${x},167 Q${x + 8},167 ${x + 8},158 L${x + 8},120 Z" fill="url(#g-${k}-body)" ${st}/>
      <ellipse cx="${x}" cy="163" rx="9.5" ry="5.5" fill="url(#g-${k}-cream)"/></g>`;
  return `<svg viewBox="0 0 240 200">
  ${defsFor(k, b)}
  <g class="flip">
  ${contactShadow(120, 173, 76, 10)}
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'side', 'back')}
    <g class="p-tail" data-part>
      <path d="M46,110 Q10,104 12,64 Q14,36 36,34" stroke="url(#g-${k}-body)" stroke-width="15" fill="none" stroke-linecap="round"/>
      <circle cx="37" cy="34" r="8" fill="${b.cream}"/>
    </g>
    ${leg(90, 'legB2')}${leg(170, 'legF2')}
    <path d="${CSBODY}" fill="url(#g-${k}-body)" ${st}/>
    ${volume(k, CSBODY)}
    <path d="M120,34 C90,34 62,48 52,76 Q100,56 148,62 Q180,68 194,88 C188,54 160,36 120,34 Z" fill="${b.light}" opacity=".3"/>
    ${b.stripes ? `<g stroke="${b.stripes}" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M78,52 Q84,70 78,88"/><path d="M100,46 Q106,66 100,86"/><path d="M122,44 Q128,64 122,84"/></g>` : ''}
    ${b.patch ? `<ellipse cx="96" cy="70" rx="26" ry="22" fill="#f0a04b" opacity=".9"/>
      <ellipse cx="150" cy="60" rx="20" ry="16" fill="#5b4636" opacity=".85"/>` : ''}
    ${leg(104, 'legB1')}${leg(184, 'legF1')}
    <path d="M120,94 C106,94 98,106 98,120 C98,142 108,150 122,150 C138,150 146,138 144,118 C142,102 134,94 120,94 Z"
      fill="url(#g-${k}-cream)" opacity=".85"/>
    <g class="p-earL" data-part>
      <path d="M150,36 L152,0 Q153,-8 161,-2 L182,24 Q164,26 150,36 Z" fill="url(#g-${k}-body)" ${st}/>
      <path d="M157,32 L158,10 Q159,6 163,9 L175,24 Q164,26 157,32 Z" fill="${b.earIn}"/>
    </g>
    <g class="p-face" data-part>
      <path d="M194,74 Q216,72 220,88 Q222,99 210,102 Q196,105 188,96 Z" fill="url(#g-${k}-cream)"/>
      <path d="M212,84 L221,84 Q223,88 220,91 L212,90 Z" fill="#f0899e"/>
      <path d="M212,94 Q205,100 198,94" fill="none" stroke="${b.dark}" stroke-width="3" stroke-linecap="round"/>
      <g class="p-eyes-open" data-part>
        <ellipse cx="182" cy="68" rx="8" ry="9.5" fill="url(#g-${k}-iris)"/>
        <ellipse cx="182" cy="68" rx="2.6" ry="8" fill="${b.dark}"/>
        <circle cx="179" cy="63" r="2.6" fill="#fff"/>
      </g>
      <g class="p-eyes-happy" data-part fill="none" stroke="${b.dark}" stroke-width="5" stroke-linecap="round">
        <path d="M173,70 Q182,60 191,70"/>
      </g>
      <g class="p-eyes-sleep" data-part fill="none" stroke="${b.dark}" stroke-width="4.5" stroke-linecap="round">
        <path d="M174,69 Q182,75 190,69"/>
      </g>
      <ellipse cx="188" cy="86" rx="7" ry="4.5" fill="${b.blush}" opacity=".8"/>
      <g stroke="${b.dark}" stroke-width="2.2" stroke-linecap="round" opacity=".5">
        <path d="M204,88 L232,80 M204,94 L234,96"/>
      </g>
      <path class="p-tongue" data-part d="M200,98 L211,98 Q211,109 205,109 Q200,109 200,98 Z" fill="#ff8fa3"/>
    </g>
    <path d="M144,104 Q168,122 192,100 L194,112 Q168,136 142,116 Z" fill="url(#g-${k}-collar)"/>
    <circle cx="170" cy="130" r="6.5" fill="#ffd766"/><circle cx="167.8" cy="127.8" r="2.2" fill="#fff2c0"/>
    ${clothesLayer(equipped, 'side', 'fore')}
  </g></g></svg>`;
}

/* ---------- 正面视图 ---------- */
export function petSVG(breed, equipped) {
  if (isCat(breed)) return catFrontSVG(breed, equipped);
  const b = BREEDS[breed], k = breed;
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3.5"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".4"`;
  const BODY = 'M100,26 C54,26 30,72 28,124 C26,172 56,200 100,200 C144,200 174,172 172,124 C170,72 146,26 100,26 Z';
  const rim = b.outline ? `stroke="${b.outline}" stroke-width="2.5" stroke-opacity=".7"` : `stroke="${shadowTone(b.main, .5)}" stroke-width="2" stroke-opacity=".28"`;
  return `<svg viewBox="0 0 200 212">
  ${defsFor(k, b)}
  <g class="flip">
  ${contactShadow(100, 202, 62, 11)}
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'front', 'back')}
    ${tailF(k, b)}
    <g class="p-head" data-part>${earsF(k, b)}</g>
    <path d="${BODY}" fill="url(#g-${k}-body)" ${rim}/>
    ${volume(k, BODY)}
    <path d="M100,86 C76,86 62,102 60,128 C58,166 74,196 100,196 C126,196 142,166 140,128 C138,102 124,86 100,86 Z"
      fill="url(#g-${k}-cream)"/>
    <path d="M100,86 C76,86 62,102 60,128 Q100,104 140,128 C138,102 124,86 100,86 Z"
      fill="${shadowTone(b.cream, .18)}" opacity=".5" filter="url(#f-soft)"/>
    <ellipse cx="30" cy="142" rx="11" ry="16" fill="url(#g-${k}-body)" transform="rotate(14 30 142)"/>
    <ellipse cx="170" cy="142" rx="11" ry="16" fill="url(#g-${k}-body)" transform="rotate(-14 170 142)"/>
    <path d="M42,164 Q100,186 158,164 L158,176 Q100,199 42,176 Z" fill="url(#g-${k}-collar)"/>
    <path d="M42,164 Q100,186 158,164 L158,168 Q100,190 42,168 Z" fill="#fff" opacity=".28"/>
    <circle cx="100" cy="184" r="8.5" fill="url(#g-${k}-bell)"/>
    <circle cx="96.6" cy="180.6" r="2.6" fill="#fffbe8" opacity=".9"/>
    <path d="M94,187 Q100,191 106,187" fill="none" stroke="#a8790f" stroke-width="1.6" opacity=".6"/>
    <circle cx="100" cy="190" r="2" fill="#a8790f"/>
    <ellipse cx="72" cy="197" rx="15" ry="8.5" fill="url(#g-${k}-cream)"/>
    <ellipse cx="128" cy="197" rx="15" ry="8.5" fill="url(#g-${k}-cream)"/>
    <ellipse cx="72" cy="199.5" rx="14" ry="5" fill="${shadowTone(b.cream, .22)}" opacity=".45"/>
    <ellipse cx="128" cy="199.5" rx="14" ry="5" fill="${shadowTone(b.cream, .22)}" opacity=".45"/>
    <path d="M68,193 v6 M76,193 v6 M124,193 v6 M132,193 v6" stroke="rgba(120,80,40,.2)" stroke-width="2" stroke-linecap="round"/>
    <g class="p-face" data-part>
      ${b.blaze ? `<path d="M100,28 C93,46 91,64 93,84 L107,84 C109,64 107,46 100,28 Z" fill="${b.cream}" opacity=".85"/>` : ''}
      ${b.brows ? `<circle cx="74" cy="70" r="4.5" fill="${b.brows}" opacity=".95"/><circle cx="126" cy="70" r="4.5" fill="${b.brows}" opacity=".95"/>` : ''}
      <g class="p-eyes-open" data-part>
        <ellipse cx="74" cy="93.6" rx="8.4" ry="7.6" fill="${shadowTone(b.main, .35)}" opacity=".3" filter="url(#f-soft)"/>
        <circle cx="74" cy="92" r="8.2" fill="url(#g-${k}-eye)"/>
        <circle cx="70.8" cy="88.6" r="3" fill="#fff"/><circle cx="77.4" cy="95.4" r="1.5" fill="#fff" opacity=".65"/>
        <circle cx="126" cy="92" r="8.2" fill="url(#g-${k}-eye)"/>
        <circle cx="122.8" cy="88.6" r="3" fill="#fff"/><circle cx="129.4" cy="95.4" r="1.5" fill="#fff" opacity=".65"/>
      </g>
      <g class="p-eyes-happy" data-part fill="none" stroke="${b.dark}" stroke-width="5.5" stroke-linecap="round">
        <path d="M64,94 Q74,84 84,94"/><path d="M116,94 Q126,84 136,94"/>
      </g>
      <g class="p-eyes-sleep" data-part fill="none" stroke="${b.dark}" stroke-width="4.5" stroke-linecap="round">
        <path d="M66,93 Q74,99 82,93"/><path d="M118,93 Q126,99 134,93"/>
      </g>
      <ellipse cx="52" cy="110" rx="10" ry="6" fill="${b.blush}" opacity=".7" filter="url(#f-soft)"/>
      <ellipse cx="148" cy="110" rx="10" ry="6" fill="${b.blush}" opacity=".7" filter="url(#f-soft)"/>
      <path d="M93,104 Q100,99 107,104 Q107,112 100,112 Q93,112 93,104 Z" fill="url(#g-${k}-eye)"/>
      <ellipse cx="97" cy="103.4" rx="2.2" ry="1.3" fill="#fff" opacity=".55"/>
      <path d="M100,111 L100,118 M87,120 Q94,127 100,118 Q106,127 113,120" fill="none" stroke="${b.dark}" stroke-width="3.4" stroke-linecap="round"/>
      <path class="p-tongue" data-part d="M93,121 L107,121 Q107,136 100,136 Q93,136 93,121 Z" fill="#ff8fa3"/>
      <path class="p-tongue" d="M93,121 L107,121 Q107,126 100,126 Q93,126 93,121 Z" fill="#ffb3c1" opacity=".7"/>
      ${clothesLayer(equipped, 'front', 'fore')}
    </g>
  </g></g></svg>`;
}

/* ---------- 侧面视图（默认朝右，走路用）---------- */
function earsS(k, b) {
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".45"`;
  if (b.ear === 'floppy') return `<g class="p-earL" data-part>
      <path d="M150,24 Q128,28 130,62 Q132,80 148,76 Q160,72 160,50 Q160,30 150,24 Z" fill="url(#g-${k}-ear)" ${st}/></g>`;
  if (b.ear === 'puff') return `<g class="p-earL" data-part>
      <circle cx="152" cy="26" r="17" fill="url(#g-${k}-body)" ${st}/><circle cx="140" cy="36" r="10" fill="url(#g-${k}-body)" ${st}/></g>`;
  const big = b.ear === 'big';
  const h = big ? 22 : 16;
  return `<g class="p-earL" data-part>
      <path d="M138,30 Q134,${2 - (big ? 6 : 0)} 152,${0 - (big ? 4 : 0)} Q170,${2 - (big ? 6 : 0)} 168,32 Q154,40 138,30 Z" fill="url(#g-${k}-body)" ${st}/>
      <path d="M146,26 Q145,${10 - (big ? 5 : 0)} 153,${8 - (big ? 4 : 0)} Q162,${10 - (big ? 5 : 0)} 160,28 Q152,33 146,26 Z" fill="${b.earIn}"/>
    </g>`;
}
function tailS(k, b) {
  if (b.tail === 'curl') return `<g class="p-tail" data-part>
      <circle cx="38" cy="66" r="16" fill="url(#g-${k}-body)"/><circle cx="34" cy="61" r="8" fill="${b.cream}"/></g>`;
  if (b.tail === 'nub') return `<ellipse class="p-tail" data-part cx="34" cy="84" rx="10" ry="9" fill="url(#g-${k}-body)"/>`;
  if (b.tail === 'puff') return `<g class="p-tail" data-part>
      <circle cx="36" cy="72" r="13" fill="url(#g-${k}-body)"/><circle cx="28" cy="62" r="8" fill="url(#g-${k}-body)"/></g>`;
  return `<g class="p-tail" data-part>
      <path d="M40,84 Q10,70 16,38" stroke="url(#g-${k}-body)" stroke-width="15" stroke-linecap="round" fill="none"/>
      <circle cx="17" cy="40" r="9" fill="${b.cream}"/></g>`;
}
export function petSideSVG(breed, equipped) {
  if (isCat(breed)) return catSideSVG(breed, equipped);
  const b = BREEDS[breed], k = breed + '-s';   // 独立渐变命名空间：display:none 里的同名 defs 会让引用失效
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3.5"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".4"`;
  const DSBODY = 'M120,22 C74,20 40,48 38,92 C36,128 62,148 116,148 C170,150 204,128 202,84 C200,46 168,24 120,22 Z';
  const leg = (x, cls) => `<g class="sleg ${cls}" data-part>
      <path d="M${x - 9},118 L${x - 9},158 Q${x - 9},168 ${x},168 Q${x + 9},168 ${x + 9},158 L${x + 9},118 Z" fill="url(#g-${k}-body)" ${st}/>
      <ellipse cx="${x}" cy="164" rx="10.5" ry="6" fill="url(#g-${k}-cream)"/></g>`;
  return `<svg viewBox="0 0 240 200">
  ${defsFor(k, b)}
  <g class="flip">
  ${contactShadow(120, 173, 78, 10)}
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'side', 'back')}
    ${tailS(k, b)}
    ${leg(88, 'legB2')}${leg(168, 'legF2')}
    <path d="${DSBODY}" fill="url(#g-${k}-body)" ${st}/>
    ${volume(k, DSBODY)}
    <path d="M120,26 C88,26 60,42 50,72 Q100,52 150,58 Q184,64 198,84 C192,48 162,28 120,26 Z" fill="${b.light}" opacity=".35"/>
    <path d="M44,110 C58,140 90,150 130,148 Q80,158 56,136 Q46,124 44,110 Z" fill="${b.deep}" opacity=".18"/>
    ${leg(102, 'legB1')}${leg(182, 'legF1')}
    <path d="M120,90 C104,90 96,102 96,118 C96,140 106,150 122,150 C140,150 148,138 146,116 C144,100 136,90 120,90 Z"
      fill="url(#g-${k}-cream)" opacity=".9"/>
    ${earsS(k, b)}
    <g class="p-face" data-part>
      <path d="M192,76 Q216,74 221,90 Q224,102 212,105 Q196,108 188,99 Z" fill="url(#g-${k}-cream)"/>
      <ellipse cx="218" cy="86" rx="6.5" ry="5.5" fill="${b.dark}"/>
      <circle cx="216" cy="84" r="1.8" fill="#8a6a52"/>
      <path d="M214,98 Q207,104 200,98" fill="none" stroke="${b.dark}" stroke-width="3.2" stroke-linecap="round"/>
      <path class="p-tongue" data-part d="M202,100 L214,100 Q214,112 208,112 Q202,112 202,100 Z" fill="#ff8fa3"/>
      ${b.brows ? `<circle cx="172" cy="48" r="4" fill="${b.brows}"/>` : ''}
      <g class="p-eyes-open" data-part>
        <circle cx="176" cy="66" r="7.8" fill="url(#g-${k}-eye)"/><circle cx="173" cy="63" r="2.8" fill="#fff"/>
      </g>
      <g class="p-eyes-happy" data-part fill="none" stroke="${b.dark}" stroke-width="5" stroke-linecap="round">
        <path d="M167,68 Q176,59 185,68"/>
      </g>
      <g class="p-eyes-sleep" data-part fill="none" stroke="${b.dark}" stroke-width="4.5" stroke-linecap="round">
        <path d="M168,67 Q176,73 184,67"/>
      </g>
      <ellipse cx="182" cy="84" rx="8" ry="5" fill="${b.blush}" opacity=".8"/>
    </g>
    <path d="M148,106 Q172,124 197,102 L199,114 Q172,138 146,118 Z" fill="url(#g-${k}-collar)"/>
    <circle cx="174" cy="132" r="7" fill="#ffd766"/><circle cx="171.5" cy="129.5" r="2.4" fill="#fff2c0"/>
    ${clothesLayer(equipped, 'side', 'fore')}
  </g></g></svg>`;
}

/* ---------- 小精灵 ---------- */
export function elfSVG() {
  return `<svg viewBox="0 0 120 130">
    <defs>
      <radialGradient id="g-elf-wing" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#e8fff6"/><stop offset="100%" stop-color="#9fd8c2"/>
      </radialGradient>
      <radialGradient id="g-elf-face" cx="36%" cy="28%" r="82%">
        <stop offset="0%" stop-color="#fff3cc"/><stop offset="40%" stop-color="#ffe08e"/>
        <stop offset="76%" stop-color="#ffd166"/><stop offset="100%" stop-color="#e8a92e"/>
      </radialGradient>
      <linearGradient id="g-elf-dress" x1="0" y1="0" x2=".3" y2="1">
        <stop offset="0%" stop-color="#ffd9e4"/><stop offset="55%" stop-color="#ffb0ca"/><stop offset="100%" stop-color="#f2789f"/>
      </linearGradient>
      <linearGradient id="g-elfrim" x1="0" y1="0" x2=".8" y2="1">
        <stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="76%" stop-color="#fff6c8" stop-opacity="0"/>
        <stop offset="100%" stop-color="#fff6c8" stop-opacity=".55"/>
      </linearGradient>
    </defs>
    <g class="elf-wing-l"><ellipse cx="20" cy="66" rx="17" ry="26" fill="url(#g-elf-wing)" opacity=".92" transform="rotate(18 20 66)"/>
      <ellipse cx="17" cy="58" rx="6" ry="11" fill="#fff" opacity=".5" transform="rotate(18 17 58)"/></g>
    <g class="elf-wing-r"><ellipse cx="100" cy="66" rx="17" ry="26" fill="url(#g-elf-wing)" opacity=".92" transform="rotate(-18 100 66)"/>
      <ellipse cx="103" cy="58" rx="6" ry="11" fill="#fff" opacity=".5" transform="rotate(-18 103 58)"/></g>
    <path d="M42,96 Q38,118 32,124 Q60,132 88,124 Q82,118 78,96 Z" fill="url(#g-elf-dress)"/>
    <path d="M36,121 q6,-4 10,2 q6,-6 14,-2 q8,-4 14,2 q4,-6 10,-2 l-2,4 q-24,6 -44,0 Z" fill="#ff8bab"/>
    <ellipse cx="60" cy="98" rx="30" ry="7" fill="#c99b3f" opacity=".28"/>
    <circle cx="60" cy="62" r="34" fill="url(#g-elf-face)"/>
    <circle cx="60" cy="62" r="34" fill="url(#g-elfrim)"/>
    <ellipse cx="48" cy="48" rx="11" ry="7" fill="#fff" opacity=".38" transform="rotate(-24 48 48)"/>
    <path d="M28,56 Q26,26 52,22 Q46,30 48,36 Q58,20 78,24 Q72,30 74,36 Q84,32 92,42 Q94,50 92,56 Q76,40 60,42 Q40,44 28,56 Z" fill="#f2a94e"/>
    <path d="M60,22 Q59,12 66,8" stroke="#f2a94e" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M66,4 l2.4,4.8 5.3,.8 -3.9,3.8 .9,5.3 -4.7,-2.5 -4.8,2.5 .9,-5.3 -3.8,-3.8 5.3,-.8 Z" fill="#ffb0c8"/>
    <path d="M44,62 Q50,55 56,62 M64,62 Q70,55 76,62" stroke="#7a4f2e" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="42" cy="72" rx="6.5" ry="4" fill="#ffb3bd" opacity=".85"/>
    <ellipse cx="78" cy="72" rx="6.5" ry="4" fill="#ffb3bd" opacity=".85"/>
    <path d="M52,76 Q60,84 68,76" stroke="#7a4f2e" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export function tubSVG() {
  return `<svg class="tub" viewBox="0 0 320 270">
    <defs>${sharedDefs()}${solidMat('m-tub', '#8fd0ea')}
      ${bodyMat('m-water', '#bfe9f7', { hi: .5, core: .14, deep: .26 })}
      ${glossMat('m-duck', '#ffd766')}</defs>
    ${contactShadow(160, 254, 138, 15)}
    <path d="M40,130 L280,130 Q298,130 296,148 L283,224 Q279,250 248,250 L72,250 Q41,250 37,224 L24,148 Q22,130 40,130 Z" fill="url(#m-tub-front)"/>
    <path d="M40,130 L96,130 L82,250 L72,250 Q41,250 37,224 L24,148 Q22,130 40,130 Z" fill="url(#m-tub-side)" opacity=".65"/>
    <path d="M40,130 L280,130 Q298,130 296,148 L292,172 Q160,190 28,172 L24,148 Q22,130 40,130 Z" fill="#fff" opacity=".22"/>
    <ellipse cx="160" cy="132" rx="134" ry="24" fill="url(#m-tub-top)"/>
    <ellipse cx="160" cy="134" rx="120" ry="19" fill="#5fa8c8"/>
    <ellipse cx="160" cy="131" rx="118" ry="17" fill="url(#m-water)"/>
    <ellipse cx="122" cy="126" rx="44" ry="8" fill="#fff" opacity=".75"/>
    <g><circle cx="70" cy="122" r="13" fill="#fff"/><circle cx="66" cy="118" r="4.5" fill="#fff"/>
      <circle cx="93" cy="131" r="10" fill="#fff" opacity=".95"/>
      <circle cx="236" cy="124" r="12" fill="#fff"/><circle cx="256" cy="133" r="9" fill="#fff" opacity=".9"/>
      <circle cx="196" cy="120" r="8" fill="#fff" opacity=".8"/></g>
    <g transform="translate(214,112)">
      <ellipse cy="16" rx="20" ry="5" fill="#4f93b0" opacity=".35"/>
      <ellipse rx="19" ry="13" fill="url(#m-duck)"/>
      <circle cx="15" cy="-11" r="10" fill="#ffe08e"/>
      <path d="M22,-12 l9,3 -9,3 Z" fill="#f0a45f"/>
      <circle cx="18" cy="-14" r="2.2" fill="#5b3a29"/><circle cx="18.6" cy="-14.6" r=".8" fill="#fff"/>
    </g>
    <path d="M56,250 l-10,13 M264,250 l10,13" stroke="#5fa8c8" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="46" cy="266" rx="12" ry="5" fill="#4f93b0"/><ellipse cx="274" cy="266" rx="12" ry="5" fill="#4f93b0"/>
    ${specular(80, 190, 12, 34, 8, .22)}
  </svg>`;
}

export function bowlSVG(kind) {
  const base = kind === 'water' ? '#5ba8de' : '#f25d7e';
  const inner = kind === 'water'
    ? `<ellipse cx="60" cy="34" rx="34" ry="9" fill="#4f93b8"/>
       <ellipse cx="60" cy="33" rx="32" ry="8" fill="#bfe4f2"/>
       <ellipse cx="50" cy="31" rx="11" ry="2.8" fill="#fff" opacity=".85"/>`
    : `<ellipse cx="60" cy="34" rx="34" ry="9" fill="#6b4526"/>
       <g class="kibble" opacity="0">
         <circle cx="48" cy="33" r="5.5" fill="#cf9256"/><circle cx="46.5" cy="31.5" r="2" fill="#e8b483"/>
         <circle cx="61" cy="35" r="5.5" fill="#ba7c42"/><circle cx="59.5" cy="33.5" r="2" fill="#d99f6b"/>
         <circle cx="73" cy="32" r="5.5" fill="#cf9256"/><circle cx="71.5" cy="30.5" r="2" fill="#e8b483"/>
         <circle cx="55" cy="30" r="4.5" fill="#dfa268"/></g>`;
  return `<svg viewBox="0 0 120 76">
    <defs>${sharedDefs()}${solidMat('m-bowl-' + kind, base)}${bodyMat('m-bowlb-' + kind, base, {hi:.45, core:.2, deep:.34})}</defs>
    ${contactShadow(60, 68, 44, 8)}
    <path d="M18,32 L102,32 Q109,32 107,41 L100,58 Q98,67 87,67 L33,67 Q22,67 20,58 L13,41 Q11,32 18,32 Z" fill="url(#m-bowl-${kind}-front)"/>
    <path d="M18,32 L38,32 L33,67 Q22,67 20,58 L13,41 Q11,32 18,32 Z" fill="url(#m-bowl-${kind}-side)" opacity=".6"/>
    <ellipse cx="60" cy="33" rx="46" ry="12" fill="url(#m-bowlb-${kind})"/>
    <ellipse cx="60" cy="34" rx="38" ry="9.5" fill="url(#m-bowl-${kind}-side)" opacity=".5"/>
    ${inner}
    ${specular(34, 46, 6, 9, 14, .3)}
  </svg>`;
}

/* ---------- 家具：真 3D 体块（顶面/前面/侧面 + 投影 + 高光）---------- */
const FDEF = (id, base) => `<defs>${sharedDefs()}${solidMat(id, base)}</defs>`;

export const FURNI = [
  { id: 'bed', name: '温暖狗窝', price: 15, w: 27, zone: 'floor', use: 'sleep',
    svg: `<svg viewBox="0 0 150 116">
      ${FDEF('m-bed', '#d9a066')}
      <defs>${softMat('m-bedpad', '#fff2dc')}${bodyMat('m-bedin', '#b98450', {core:.3, deep:.46})}</defs>
      ${contactShadow(75, 104, 66, 12)}
      <ellipse cx="75" cy="96" rx="62" ry="19" fill="url(#m-bed-side)"/>
      <path d="M13,58 L13,84 Q13,102 40,110 Q75,118 110,110 Q137,102 137,84 L137,58 Z" fill="url(#m-bed-front)"/>
      <path d="M13,58 L13,84 Q13,96 30,104 L30,64 Z" fill="url(#m-bed-side)" opacity=".85"/>
      <ellipse cx="75" cy="58" rx="62" ry="24" fill="url(#m-bed-top)"/>
      <ellipse cx="75" cy="60" rx="50" ry="18" fill="url(#m-bedin)"/>
      <ellipse cx="75" cy="63" rx="46" ry="15.5" fill="url(#m-bedpad)"/>
      <ellipse cx="75" cy="66" rx="37" ry="11" fill="#fffaf1"/>
      <ellipse cx="75" cy="64" rx="34" ry="9.5" fill="#f4a3a3"/>
      <ellipse cx="75" cy="62.5" rx="34" ry="8" fill="#ffbcbc"/>
      <ellipse cx="66" cy="60.5" rx="14" ry="3.4" fill="#ffdcdc" opacity=".8"/>
      ${specular(44, 50, 15, 6, -18, .35)}
      <path d="M17,66 q-4,-8 4,-12 M133,66 q4,-8 -4,-12" stroke="#a97a44" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
    </svg>` },
  { id: 'cushion', name: '软软坐垫', price: 10, w: 23, zone: 'floor', use: 'sit',
    svg: `<svg viewBox="0 0 150 104">
      ${FDEF('m-cu', '#a3d8c2')}
      <defs>${bodyMat('m-cuball', '#bfe8d8', {hi:.4, core:.2, deep:.34})}</defs>
      ${contactShadow(75, 92, 60, 11)}
      <ellipse cx="75" cy="82" rx="58" ry="17" fill="url(#m-cu-side)"/>
      <path d="M17,50 L17,66 Q17,82 46,89 Q75,96 104,89 Q133,82 133,66 L133,50 Z" fill="url(#m-cu-front)"/>
      <ellipse cx="75" cy="50" rx="58" ry="23" fill="url(#m-cuball)"/>
      <path d="M34,42 Q75,32 116,42" stroke="#8bc4ab" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M26,58 Q75,72 124,58" stroke="#8bc4ab" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
      <circle cx="75" cy="50" r="6.5" fill="#7bb69d"/><circle cx="73" cy="48" r="2.2" fill="#d9f2e7"/>
      ${specular(50, 40, 16, 7, -20, .4)}
    </svg>` },
  { id: 'ball', name: '彩色小球', price: 8, w: 13, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 90 92">
      <defs>${sharedDefs()}${bodyMat('m-ball', '#ff8a80', {hi:.55, core:.26, deep:.42})}</defs>
      ${contactShadow(45, 80, 26, 7)}
      <circle cx="45" cy="45" r="30" fill="url(#m-ball)"/>
      <circle cx="45" cy="45" r="30" fill="url(#m-ball-bounce)"/>
      <circle cx="45" cy="45" r="30" fill="url(#m-ball-rim)"/>
      <path d="M17,32 A30,30 0 0,1 73,32 Q64,44 45,44 Q26,44 17,32 Z" fill="#fff" opacity=".9"/>
      <path d="M45,34 l2.8,5.8 6.4,.9 -4.6,4.5 1.1,6.3 -5.7,-3 -5.7,3 1.1,-6.3 -4.6,-4.5 6.4,-.9 Z" fill="#ffd166"/>
      ${specular(32, 27, 9, 5.5, -24, .8)}
    </svg>` },
  { id: 'yarn', name: '毛线球', price: 8, w: 13, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 90 92">
      <defs>${sharedDefs()}${bodyMat('m-yarn', '#ec8bb0', {hi:.5, core:.24, deep:.4})}</defs>
      ${contactShadow(43, 80, 25, 7)}
      <circle cx="43" cy="46" r="28" fill="url(#m-yarn)"/>
      <circle cx="43" cy="46" r="28" fill="url(#m-yarn-bounce)"/>
      <circle cx="43" cy="46" r="28" fill="url(#m-yarn-rim)"/>
      <g stroke="#d4638f" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85">
        <path d="M19,35 Q43,22 67,35"/><path d="M17,48 Q43,37 69,48"/><path d="M21,61 Q43,52 65,61"/>
      </g>
      <path d="M68,58 Q84,64 82,78" stroke="#d4638f" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      ${specular(30, 30, 9, 5, -24, .65)}
    </svg>` },
  { id: 'bone', name: '骨头玩具', price: 10, w: 15, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 120 70">
      <defs>${sharedDefs()}${bodyMat('m-bone', '#f5ead6', {hi:.5, core:.16, deep:.3})}</defs>
      ${contactShadow(60, 60, 38, 7)}
      <g>
        <circle cx="24" cy="24" r="13" fill="url(#m-bone)"/><circle cx="24" cy="42" r="13" fill="url(#m-bone)"/>
        <circle cx="94" cy="24" r="13" fill="url(#m-bone)"/><circle cx="94" cy="42" r="13" fill="url(#m-bone)"/>
        <rect x="24" y="22" width="70" height="22" rx="11" fill="url(#m-bone)"/>
      </g>
      <path d="M24,44 a13,13 0 0,0 0,-2 M94,44 a13,13 0 0,0 0,-2" fill="none"/>
      <rect x="30" y="26" width="56" height="6" rx="3" fill="#fff" opacity=".55"/>
      ${specular(28, 18, 8, 4, -20, .6)}
    </svg>` },
  { id: 'plant', name: '小盆栽', price: 12, w: 16, zone: 'floor', use: null,
    svg: `<svg viewBox="0 0 100 132">
      ${FDEF('m-pot', '#d98354')}
      <defs>${bodyMat('m-leaf', '#7cc17c', {hi:.42, core:.22, deep:.38})}
      ${bodyMat('m-leaf2', '#9ad39a', {hi:.42, core:.2, deep:.34})}</defs>
      ${contactShadow(50, 122, 30, 8)}
      <path d="M50,70 Q22,58 24,26 Q50,34 50,70 Z" fill="url(#m-leaf2)"/>
      <path d="M50,70 Q78,58 76,26 Q50,34 50,70 Z" fill="url(#m-leaf)"/>
      <path d="M50,74 Q50,46 50,20" stroke="#5fa55f" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M50,20 Q38,10 40,0 Q55,4 50,20 Z" fill="url(#m-leaf2)"/>
      <path d="M27,80 L73,80 L66,120 Q65,127 57,127 L43,127 Q35,127 34,120 Z" fill="url(#m-pot-front)"/>
      <path d="M27,80 L34,120 Q35,127 43,127 L43,80 Z" fill="url(#m-pot-side)" opacity=".7"/>
      <ellipse cx="50" cy="80" rx="23" ry="7" fill="#5a3d24"/>
      <ellipse cx="50" cy="79" rx="23" ry="6.4" fill="#6b4a2c"/>
      <path d="M22,72 L78,72 Q82,72 82,78 Q82,84 78,84 L22,84 Q18,84 18,78 Q18,72 22,72 Z" fill="url(#m-pot-top)"/>
      ${specular(36, 96, 5, 12, 8, .3)}
    </svg>` },
  { id: 'lamp', name: '暖暖小灯', price: 20, w: 17, zone: 'floor', use: null,
    svg: `<svg viewBox="0 0 110 200">
      ${FDEF('m-lamp', '#b07a42')}
      <defs>${bodyMat('m-shade', '#ffc48a', {hi:.5, core:.18, deep:.3})}
        <radialGradient id="m-glow" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stop-color="#fff0b8" stop-opacity=".9"/>
          <stop offset="60%" stop-color="#ffdd8a" stop-opacity=".38"/>
          <stop offset="100%" stop-color="#ffd166" stop-opacity="0"/>
        </radialGradient></defs>
      <ellipse class="glowlight" cx="55" cy="46" rx="54" ry="50" fill="url(#m-glow)"/>
      ${contactShadow(55, 190, 32, 8)}
      <path d="M30,16 L80,16 L92,72 L18,72 Z" fill="url(#m-shade)"/>
      <path d="M30,16 L80,16 L83,32 L27,32 Z" fill="#ffe0b8" opacity=".75"/>
      <path d="M30,16 L41,16 L30,72 L18,72 Z" fill="#f0a45f" opacity=".45"/>
      <ellipse cx="55" cy="72" rx="37" ry="6" fill="#e79a54"/>
      <ellipse cx="55" cy="71" rx="37" ry="5.4" fill="#ffca97"/>
      <rect x="51.5" y="74" width="7" height="102" rx="3.5" fill="url(#m-lamp-front)"/>
      <rect x="51.5" y="74" width="2.6" height="102" fill="#d9a066" opacity=".8"/>
      <ellipse cx="55" cy="184" rx="29" ry="9" fill="url(#m-lamp-side)"/>
      <ellipse cx="55" cy="180" rx="29" ry="8.4" fill="url(#m-lamp-top)"/>
      ${specular(38, 34, 7, 14, 6, .3)}
    </svg>` },
  { id: 'frame', name: '爱心画框', price: 15, w: 16, zone: 'wall', use: null,
    svg: `<svg viewBox="0 0 110 110">
      ${FDEF('m-fr', '#d9a066')}
      <ellipse cx="58" cy="100" rx="42" ry="6" fill="#7a4a20" opacity=".16" filter="url(#f-soft)"/>
      <rect x="10" y="8" width="90" height="90" rx="11" fill="url(#m-fr-front)"/>
      <rect x="10" y="8" width="90" height="12" rx="6" fill="url(#m-fr-top)"/>
      <rect x="10" y="8" width="11" height="90" rx="5" fill="url(#m-fr-side)" opacity=".55"/>
      <rect x="20" y="18" width="70" height="70" rx="7" fill="#8a5f36" opacity=".45"/>
      <rect x="22" y="20" width="66" height="66" rx="6" fill="#fffaf0"/>
      <path d="M55,72 C33,55 29,40 42,34 C51,30 55,38 55,41 C55,38 59,30 68,34 C81,40 77,55 55,72 Z" fill="#ff8fa3"/>
      <path d="M55,72 C33,55 29,40 42,34 C51,30 55,38 55,41 Q48,50 55,72 Z" fill="#ffa8b8" opacity=".6"/>
      <path d="M46,38 a5,5 0 0,1 6,3" stroke="#ffd0d8" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="22" y="20" width="66" height="20" fill="url(#g-glass)" opacity=".35"/>
    </svg>` },
];

/* ---------- 房间 2.5D：三面墙透视 ---------- */
export function roomBgSVG() {
  let planks = '';
  for (let i = 0; i <= 8; i++) {
    const tx = 240 + i * 140, bx = -160 + i * 240;
    planks += `<line x1="${tx}" y1="430" x2="${bx}" y2="1000" stroke="#b98450" stroke-width="3.5" opacity=".35"/>`;
  }
  for (const y of [520, 640, 790, 940]) {
    planks += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#b98450" stroke-width="3.5" opacity=".3"/>`;
  }
  let scallop = '';
  for (let a = 0; a < 360; a += 15) {
    const rx = 300 * Math.cos(a * Math.PI / 180), ry = 112 * Math.sin(a * Math.PI / 180);
    scallop += `<circle cx="${760 + rx}" cy="${790 + ry}" r="12" fill="#dff3ea"/>`;
  }
  return `<svg id="room-bg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      ${sharedDefs()}
      ${solidMat('m-wood', '#d9a066')}
      ${solidMat('m-shelf', '#d9a066')}
      ${bodyMat('m-rug', '#bfe8d8', { hi: .4, core: .16, deep: .28 })}
      ${glossMat('m-vase', '#e08e5e')}
      <linearGradient id="g-wallB" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff1da"/><stop offset="62%" stop-color="#ffe3c2"/><stop offset="100%" stop-color="#f6d0a6"/>
      </linearGradient>
      <linearGradient id="g-wallL" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#e0a877"/><stop offset="100%" stop-color="#fadfba"/>
      </linearGradient>
      <linearGradient id="g-wallR" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stop-color="#dda274"/><stop offset="100%" stop-color="#f7d9b2"/>
      </linearGradient>
      <linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#dfa068"/><stop offset="42%" stop-color="#efc08a"/><stop offset="100%" stop-color="#f8d4a2"/>
      </linearGradient>
      <linearGradient id="g-beam" x1="0" y1="0" x2=".55" y2="1">
        <stop offset="0%" stop-color="#fff6d0" stop-opacity=".62"/><stop offset="70%" stop-color="#fff6d0" stop-opacity=".16"/>
        <stop offset="100%" stop-color="#fff6d0" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="g-curtain" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#f09a63"/><stop offset="35%" stop-color="#ffc9a3"/>
        <stop offset="70%" stop-color="#f5ab7c"/><stop offset="100%" stop-color="#e08a58"/>
      </linearGradient>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a8dcf5"/><stop offset="100%" stop-color="#d8f0fb"/>
      </linearGradient>
      <radialGradient id="g-vig" cx="50%" cy="40%" r="74%">
        <stop offset="0%" stop-color="#6b3512" stop-opacity="0"/>
        <stop offset="66%" stop-color="#6b3512" stop-opacity="0"/>
        <stop offset="100%" stop-color="#6b3512" stop-opacity=".24"/>
      </radialGradient>
      <linearGradient id="g-wallshade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8a5320" stop-opacity=".22"/>
        <stop offset="100%" stop-color="#8a5320" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <rect x="200" y="0" width="1200" height="430" fill="url(#g-wallB)"/>
    <polygon points="0,0 200,0 200,430 0,600" fill="url(#g-wallL)"/>
    <polygon points="1400,0 1600,0 1600,600 1400,430" fill="url(#g-wallR)"/>
    <rect x="200" y="0" width="1200" height="120" fill="url(#g-wallshade)"/>
    <polygon points="200,0 232,0 232,430 200,430" fill="#c98f55" opacity=".22"/>
    <polygon points="1368,0 1400,0 1400,430 1368,430" fill="#c98f55" opacity=".26"/>

    <polygon points="0,600 200,430 1400,430 1600,600 1600,1000 0,1000" fill="url(#g-floor)"/>
    ${planks}
    <polygon points="0,600 200,430 1400,430 1600,600 1600,660 0,660" fill="#8a5320" opacity=".13"/>

    <rect x="200" y="416" width="1200" height="20" rx="5" fill="url(#m-wood-top)"/>
    <rect x="200" y="428" width="1200" height="8" rx="3" fill="#b98450" opacity=".7"/>
    <polygon points="0,600 200,430 200,452 20,614" fill="url(#m-wood-side)"/>
    <polygon points="1600,600 1400,430 1400,452 1580,614" fill="url(#m-wood-side)"/>

    <circle cx="700" cy="120" r="16" fill="#ffd9ab" opacity=".35"/>
    <circle cx="960" cy="220" r="13" fill="#ffd9ab" opacity=".35"/>
    <circle cx="1180" cy="110" r="14" fill="#ffd9ab" opacity=".35"/>
    <circle cx="560" cy="250" r="12" fill="#ffd9ab" opacity=".35"/>

    <g filter="url(#f-drop)">
      <rect x="270" y="60" width="330" height="300" rx="22" fill="#fffdf8"/>
    </g>
    <rect x="286" y="76" width="298" height="268" rx="14" fill="url(#g-sky)"/>
    <circle cx="370" cy="150" r="36" fill="#ffe58e"/><circle cx="370" cy="150" r="48" fill="#ffe58e" opacity=".3"/>
    <ellipse cx="490" cy="170" rx="50" ry="20" fill="#fff" opacity=".95"/>
    <ellipse cx="450" cy="182" rx="32" ry="15" fill="#fff" opacity=".9"/>
    <ellipse cx="360" cy="280" rx="40" ry="15" fill="#fff" opacity=".7"/>
    <line x1="435" y1="76" x2="435" y2="344" stroke="#fffdf8" stroke-width="13"/>
    <line x1="286" y1="212" x2="584" y2="212" stroke="#fffdf8" stroke-width="13"/>
    <rect x="286" y="76" width="298" height="268" rx="14" fill="url(#g-glass)" opacity=".3"/>
    <path d="M252,52 Q268,50 276,64 L288,160 Q294,240 276,356 L252,364 Q272,220 262,120 Z" fill="url(#g-curtain)"/>
    <path d="M618,52 Q602,50 594,64 L582,160 Q576,240 594,356 L618,364 Q598,220 608,120 Z" fill="url(#g-curtain)"/>
    <path d="M252,48 L618,48 L618,72 Q435,92 252,72 Z" fill="#e8945f"/>
    <rect x="256" y="352" width="358" height="24" rx="12" fill="url(#m-wood-top)"/>

    <polygon points="300,440 700,1000 1200,1000 620,440" fill="url(#g-beam)" pointer-events="none"/>

    <g id="door-park">
      <ellipse cx="1268" cy="440" rx="96" ry="20" fill="#7a4a20" opacity=".2" filter="url(#f-soft2)"/>
      <rect x="1176" y="124" width="184" height="310" rx="14" fill="url(#m-wood-side)"/>
      <rect x="1184" y="128" width="168" height="302" rx="12" fill="url(#m-wood-front)"/>
      <rect x="1184" y="128" width="168" height="20" rx="8" fill="url(#m-wood-top)" opacity=".8"/>
      <rect x="1198" y="146" width="140" height="120" rx="9" fill="#8a5f36" opacity=".3"/>
      <rect x="1201" y="149" width="134" height="114" rx="8" fill="#e3ac74"/>
      <rect x="1198" y="288" width="140" height="122" rx="9" fill="#8a5f36" opacity=".3"/>
      <rect x="1201" y="291" width="134" height="116" rx="8" fill="#e3ac74"/>
      <circle cx="1330" cy="290" r="10" fill="#ffd766"/><circle cx="1327" cy="287" r="3.4" fill="#fff6d0"/>
      <g transform="translate(1268,218)"><g class="door-hint">
        <ellipse rx="54" ry="35" fill="#fffaf2" filter="url(#f-drop-s)"/>
        <ellipse rx="54" ry="35" fill="none" stroke="#8fc7ae" stroke-width="4"/>
        <g fill="#c98f55"><circle cx="-12" cy="-11" r="5.5"/><circle cx="0" cy="-15" r="5.5"/><circle cx="12" cy="-11" r="5.5"/><ellipse cy="1" rx="9" ry="7"/></g>
        <text y="25" text-anchor="middle" font-size="16" fill="#8a5a36" font-weight="bold">去公园</text>
      </g></g>
      <ellipse cx="1268" cy="452" rx="88" ry="19" fill="#8fc7ae"/>
      <ellipse cx="1268" cy="448" rx="88" ry="18" fill="#c6ecdc"/>
    </g>

    <g>
      <ellipse cx="820" cy="148" rx="130" ry="10" fill="#7a4a20" opacity=".16" filter="url(#f-soft)"/>
      <rect x="700" y="118" width="240" height="20" rx="6" fill="url(#m-shelf-top)"/>
      <rect x="700" y="130" width="240" height="10" rx="4" fill="url(#m-shelf-front)"/>
      <rect x="722" y="64" width="26" height="56" rx="5" fill="#f2a0a0"/>
      <rect x="722" y="64" width="9" height="56" rx="4" fill="#fff" opacity=".3"/>
      <rect x="754" y="54" width="26" height="66" rx="5" fill="#8fc7e8"/>
      <rect x="754" y="54" width="9" height="66" rx="4" fill="#fff" opacity=".3"/>
      <rect x="786" y="74" width="26" height="46" rx="5" fill="#a5d6a7"/>
      <rect x="786" y="74" width="9" height="46" rx="4" fill="#fff" opacity=".3"/>
      <circle cx="856" cy="92" r="22" fill="#8fca8f"/><circle cx="846" cy="82" r="9" fill="#b8e3b8"/>
      <path d="M840,104 L872,104 L868,120 L844,120 Z" fill="url(#m-vase)"/>
      <rect x="886" y="58" width="48" height="62" rx="7" fill="#fffaf0" stroke="#d9a066" stroke-width="5"/>
      <circle cx="910" cy="84" r="13" fill="#f09f51"/>
      <path d="M903,82 a7,7 0 1,1 14,0" fill="#fff4e3"/>
    </g>

    <g>
      <ellipse cx="108" cy="452" rx="34" ry="8" fill="#7a4a20" opacity=".2" filter="url(#f-soft)"/>
      <path d="M108,332 Q86,300 108,270 Q130,300 108,332 Z" fill="#8fca8f"/>
      <path d="M108,332 Q86,300 108,270 Q112,300 108,332 Z" fill="#7fbc7f"/>
      <path d="M108,340 L108,392" stroke="#5fa55f" stroke-width="6" stroke-linecap="round"/>
      <path d="M82,396 L134,396 L127,444 Q126,452 116,452 L100,452 Q90,452 89,444 Z" fill="url(#m-vase)"/>
      <ellipse cx="108" cy="396" rx="26" ry="7" fill="#5a3d24"/>
      <ellipse cx="108" cy="394" rx="26" ry="6.4" fill="#6b4a2c"/>
    </g>

    <ellipse cx="760" cy="800" rx="318" ry="122" fill="#7fb9a1" opacity=".5" filter="url(#f-soft2)"/>
    <ellipse cx="760" cy="790" rx="310" ry="116" fill="#8fc7ae"/>
    ${scallop}
    <ellipse cx="760" cy="790" rx="300" ry="112" fill="url(#m-rug)"/>
    <ellipse cx="760" cy="790" rx="228" ry="82" fill="none" stroke="#fffaf0" stroke-width="7" stroke-dasharray="1 24" stroke-linecap="round"/>
    <ellipse cx="760" cy="790" rx="156" ry="54" fill="none" stroke="#95cdb5" stroke-width="5"/>
    <g fill="#95cdb5"><circle cx="740" cy="782" r="7"/><circle cx="760" cy="774" r="7"/><circle cx="780" cy="782" r="7"/><ellipse cx="760" cy="800" rx="12" ry="9"/></g>

    <rect width="1600" height="1000" fill="url(#g-vig)" pointer-events="none"/>
  </svg>`;
}

/* ---------- 公园 2.5D ---------- */
export function parkBgSVG() {
  let far = '';
  for (let i = 0; i < 7; i++) {
    const x = 60 + i * 240 + (i % 2) * 60;
    far += `<g transform="translate(${x},316)">
      <rect x="-5" y="-2" width="10" height="36" rx="4" fill="#8a6236"/>
      <circle cy="-18" r="34" fill="#7fbc7f"/><circle cx="-9" cy="-24" r="26" fill="#95cf95"/>
      <circle cx="14" cy="-14" r="22" fill="#6faf6f"/>
    </g>`;
  }
  let fence = '';
  for (let i = 0; i < 27; i++) {
    const x = 10 + i * 60;
    fence += `<g><rect x="${x}" y="352" width="15" height="68" rx="7" fill="url(#m-fence-front)"/>
      <rect x="${x}" y="352" width="5" height="68" rx="2.5" fill="#fff" opacity=".3"/>
      <ellipse cx="${x + 7.5}" cy="354" rx="7.5" ry="4" fill="#f6dbaa"/></g>`;
  }
  let flowers = '';
  const fpos = [[120, 560], [300, 700], [90, 860], [1400, 590], [1510, 760], [1330, 900], [520, 920], [1120, 940], [240, 620], [1460, 680]];
  fpos.forEach(([x, y], i) => {
    const c = ['#ff9db5', '#ffd766', '#a8d8f0', '#f2a0c4'][i % 4];
    flowers += `<g transform="translate(${x},${y})">
      <ellipse cy="6" rx="12" ry="4" fill="#5f9a5f" opacity=".28"/>
      <g class="sway"><line y1="0" y2="26" stroke="#5fa55f" stroke-width="4"/>
      <ellipse cx="7" cy="14" rx="7" ry="3" fill="#6fb56f" transform="rotate(-24 7 14)"/>
      <circle r="8.5" fill="${c}"/><circle cx="-2" cy="-2" r="3.6" fill="#fff8e0" opacity=".9"/></g></g>`;
  });
  return `<svg id="room-bg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      ${sharedDefs()}
      ${solidMat('m-fence', '#eec489')}
      ${solidMat('m-bench', '#d9a066')}
      ${bodyMat('m-tree', '#8fca8f', { hi: .4, core: .22, deep: .4 })}
      ${bodyMat('m-tree2', '#7fbc7f', { hi: .42, core: .22, deep: .4 })}
      ${glossMat('m-pond', '#8fd0e8')}
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6fc4ec"/><stop offset="55%" stop-color="#a8dcf5"/><stop offset="100%" stop-color="#dcf2fc"/>
      </linearGradient>
      <linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8bc97d"/><stop offset="35%" stop-color="#a8dc98"/>
        <stop offset="100%" stop-color="#c8ecb4"/>
      </linearGradient>
      <linearGradient id="g-path" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e7cfa0"/><stop offset="100%" stop-color="#f9ecd2"/>
      </linearGradient>
      <radialGradient id="g-sun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff6c0"/><stop offset="55%" stop-color="#ffe58e"/>
        <stop offset="100%" stop-color="#ffe58e" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g-pvig" cx="50%" cy="42%" r="76%">
        <stop offset="0%" stop-color="#1e4a1e" stop-opacity="0"/>
        <stop offset="68%" stop-color="#1e4a1e" stop-opacity="0"/>
        <stop offset="100%" stop-color="#1e4a1e" stop-opacity=".2"/>
      </radialGradient>
    </defs>

    <rect width="1600" height="430" fill="url(#g-sky)"/>
    <circle cx="1360" cy="110" r="96" fill="url(#g-sun)"/>
    <circle cx="1360" cy="110" r="50" fill="#fff4b8"/>
    <g class="cloudmove"><ellipse cx="300" cy="110" rx="80" ry="28" fill="#fff"/>
      <ellipse cx="360" cy="124" rx="52" ry="20" fill="#fff"/>
      <ellipse cx="256" cy="122" rx="40" ry="16" fill="#f0f8ff"/></g>
    <g class="cloudmove2"><ellipse cx="900" cy="80" rx="66" ry="24" fill="#fff"/>
      <ellipse cx="850" cy="94" rx="40" ry="16" fill="#f2fafd"/></g>

    <ellipse cx="800" cy="360" rx="1000" ry="72" fill="#6faf6f"/>
    ${far}
    <ellipse cx="800" cy="376" rx="1000" ry="42" fill="#7fbc7f"/>
    ${fence}
    <rect x="0" y="404" width="1600" height="16" rx="8" fill="url(#m-fence-top)"/>

    <polygon points="0,424 1600,424 1600,1000 0,1000" fill="url(#g-grass)"/>
    <rect x="0" y="424" width="1600" height="46" fill="#5f9a5f" opacity=".16"/>
    <polygon points="700,424 900,424 1250,1000 350,1000" fill="url(#g-path)"/>
    <polygon points="700,424 716,424 372,1000 350,1000" fill="#d5b98a" opacity=".8"/>
    <polygon points="884,424 900,424 1250,1000 1228,1000" fill="#d5b98a" opacity=".8"/>
    <ellipse cx="660" cy="560" rx="11" ry="5" fill="#d9c096" opacity=".7"/>
    <ellipse cx="920" cy="700" rx="13" ry="6" fill="#d9c096" opacity=".7"/>
    <ellipse cx="700" cy="880" rx="15" ry="7" fill="#d9c096" opacity=".7"/>

    <g>
      <ellipse cx="240" cy="440" rx="130" ry="26" fill="#4f8a4f" opacity=".3" filter="url(#f-soft2)"/>
      <path d="M170,430 L196,290 Q200,270 216,270 Q232,270 236,290 L262,430 Q216,446 170,430 Z" fill="#9c6b3c"/>
      <path d="M170,430 L196,290 Q200,270 216,270 L212,430 Z" fill="#7d5330" opacity=".6"/>
      <circle cx="216" cy="220" r="92" fill="url(#m-tree)"/>
      <circle cx="150" cy="272" r="64" fill="url(#m-tree2)"/>
      <circle cx="282" cy="264" r="68" fill="url(#m-tree)"/>
      <circle cx="216" cy="290" r="56" fill="#a5dc9c"/>
      <circle cx="180" cy="186" r="34" fill="#a8dea0" opacity=".65"/>
      <circle cx="178" cy="222" r="12" fill="#ff9db5"/><circle cx="266" cy="200" r="12" fill="#ffd766"/>
      <circle cx="230" cy="300" r="10" fill="#ff9db5"/>
    </g>
    <g transform="translate(1250,10)">
      <ellipse cx="216" cy="440" rx="120" ry="24" fill="#4f8a4f" opacity=".28" filter="url(#f-soft2)"/>
      <path d="M180,430 L204,300 Q208,282 222,282 Q236,282 240,300 L264,430 Q222,444 180,430 Z" fill="#9c6b3c"/>
      <circle cx="222" cy="230" r="84" fill="url(#m-tree2)"/>
      <circle cx="164" cy="278" r="58" fill="url(#m-tree)"/>
      <circle cx="280" cy="272" r="60" fill="#a5dc9c"/>
      <circle cx="196" cy="212" r="11" fill="#a8d8f0"/><circle cx="262" cy="234" r="11" fill="#f2a0c4"/>
    </g>

    <g transform="translate(1080,520)">
      <ellipse cy="8" rx="128" ry="48" fill="#4f8a4f" opacity=".28" filter="url(#f-soft2)"/>
      <ellipse rx="122" ry="45" fill="#6fb3d0"/>
      <ellipse cy="-2" rx="112" ry="39" fill="url(#m-pond)"/>
      <ellipse cx="-34" cy="-12" rx="38" ry="10" fill="#e8f8ff" opacity=".85"/>
      <ellipse cx="30" cy="8" rx="26" ry="6" fill="#fff" opacity=".45"/>
      <g transform="translate(42,-8)">
        <ellipse cy="10" rx="16" ry="4" fill="#3f7f9f" opacity=".3"/>
        <ellipse rx="14" ry="10" fill="#ffd766"/><circle cx="12" cy="-8" r="7.5" fill="#ffe08e"/>
        <path d="M17,-9 l7,2 -7,2.4 Z" fill="#f0a45f"/><circle cx="14" cy="-10" r="1.7" fill="#5b3a29"/>
      </g>
      <path d="M-118,6 Q-128,-14 -110,-20 M118,6 Q128,-14 110,-20" stroke="#6faf6f" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>

    <g transform="translate(420,616)">
      <ellipse cy="54" rx="76" ry="13" fill="#4f8a4f" opacity=".3" filter="url(#f-soft)"/>
      <path d="M-52,36 L-52,54 M52,36 L52,54" stroke="#9c6b3c" stroke-width="10" stroke-linecap="round"/>
      <path d="M-62,12 L62,12 Q72,12 72,22 L72,26 Q72,36 62,36 L-62,36 Q-72,36 -72,26 L-72,22 Q-72,12 -62,12 Z" fill="url(#m-bench-front)"/>
      <rect x="-70" y="8" width="140" height="10" rx="5" fill="url(#m-bench-top)"/>
      <rect x="-60" y="-16" width="120" height="12" rx="6" fill="url(#m-bench-top)"/>
      <rect x="-60" y="-6" width="120" height="6" rx="3" fill="#b98450" opacity=".6"/>
    </g>

    ${flowers}
    <g transform="translate(620,940)">
      <ellipse cy="22" rx="56" ry="10" fill="#4f8a4f" opacity=".28" filter="url(#f-soft)"/>
      <circle r="28" fill="url(#m-tree)"/><circle cx="32" cy="5" r="21" fill="url(#m-tree2)"/>
      <circle cx="-30" cy="7" r="19" fill="#7fbc7f"/>
    </g>
    <rect width="1600" height="1000" fill="url(#g-pvig)" pointer-events="none"/>
  </svg>`;
}

/* 公园的球 */
export function fetchBallSVG() {
  return `<svg viewBox="0 0 64 64">
    <defs>${sharedDefs()}${bodyMat('m-fball', '#ffc94d', {hi:.55, core:.2, deep:.36})}</defs>
    <circle cx="32" cy="32" r="25" fill="url(#m-fball)"/>
    <circle cx="32" cy="32" r="25" fill="url(#m-fball-bounce)"/>
    <circle cx="32" cy="32" r="25" fill="url(#m-fball-rim)"/>
    <path d="M9,25 A25,25 0 0,1 55,25" fill="none" stroke="#e8575f" stroke-width="5"/>
    <path d="M11,42 A25,25 0 0,0 53,42" fill="none" stroke="#e8575f" stroke-width="4" opacity=".55"/>
    <ellipse cx="22" cy="19" rx="7" ry="4.5" fill="#fff" opacity=".75" transform="rotate(-24 22 19)"/>
  </svg>`;
}
/* 蝴蝶 */
export function butterflySVG(color) {
  return `<svg viewBox="0 0 60 50">
    <g class="bwl"><path d="M28,25 Q6,4 4,20 Q3,34 26,29 Z" fill="${color}"/><circle cx="12" cy="18" r="4" fill="#fff" opacity=".6"/></g>
    <g class="bwr"><path d="M32,25 Q54,4 56,20 Q57,34 34,29 Z" fill="${color}"/><circle cx="48" cy="18" r="4" fill="#fff" opacity=".6"/></g>
    <ellipse cx="30" cy="26" rx="4" ry="10" fill="#5b3a29"/>
    <path d="M28,17 Q25,10 21,8 M32,17 Q35,10 39,8" stroke="#5b3a29" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
}
