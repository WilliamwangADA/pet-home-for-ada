/* ============ 矢量美术 v3：2.5D 透视 + 正/侧双视图 + 换装 ============ */

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

function defsFor(k, b) {
  return `<defs>
    <radialGradient id="g-${k}-body" cx="42%" cy="30%" r="85%">
      <stop offset="0%" stop-color="${b.light}"/><stop offset="55%" stop-color="${b.main}"/><stop offset="100%" stop-color="${b.deep}"/>
    </radialGradient>
    <linearGradient id="g-${k}-cream" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${b.creamHi}"/><stop offset="100%" stop-color="${b.cream}"/>
    </linearGradient>
    <linearGradient id="g-${k}-collar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${b.collarHi}"/><stop offset="100%" stop-color="${b.collar}"/>
    </linearGradient>
    <radialGradient id="g-${k}-ear" cx="50%" cy="25%" r="90%">
      <stop offset="0%" stop-color="${b.main}"/><stop offset="100%" stop-color="${b.earIn}"/>
    </radialGradient>
  </defs>`;
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
  const mask = b.mask ? `
    <path d="M100,72 C82,72 68,86 66,108 C64,140 78,196 100,196 C122,196 136,140 134,108 C132,86 118,72 100,72 Z" fill="${b.cream}"/>
    <ellipse cx="100" cy="104" rx="26" ry="20" fill="${b.cream}"/>` : '';
  return `<svg viewBox="0 0 200 212">
  ${defsFor(k, b)}
  <g class="flip">
  <ellipse cx="100" cy="201" rx="56" ry="8" fill="rgba(120,70,30,.16)"/>
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
    <path d="M100,26 C56,26 32,70 30,122 C28,172 58,200 100,200 C142,200 172,172 170,122 C168,70 144,26 100,26 Z"
      fill="url(#g-${k}-body)" ${st}/>
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
        <ellipse cx="74" cy="96" rx="9" ry="10.5" fill="#5fbf8f"/>
        <ellipse cx="74" cy="96" rx="3" ry="9" fill="${b.dark}"/>
        <circle cx="70.5" cy="91" r="2.8" fill="#fff"/>
        <ellipse cx="126" cy="96" rx="9" ry="10.5" fill="#5fbf8f"/>
        <ellipse cx="126" cy="96" rx="3" ry="9" fill="${b.dark}"/>
        <circle cx="122.5" cy="91" r="2.8" fill="#fff"/>
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
  const leg = (x, cls) => `<g class="sleg ${cls}" data-part>
      <path d="M${x - 8},120 L${x - 8},158 Q${x - 8},167 ${x},167 Q${x + 8},167 ${x + 8},158 L${x + 8},120 Z" fill="url(#g-${k}-body)" ${st}/>
      <ellipse cx="${x}" cy="163" rx="9.5" ry="5.5" fill="url(#g-${k}-cream)"/></g>`;
  return `<svg viewBox="0 0 240 200">
  ${defsFor(k, b)}
  <g class="flip">
  <ellipse cx="120" cy="172" rx="70" ry="8" fill="rgba(120,70,30,.16)"/>
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'side', 'back')}
    <g class="p-tail" data-part>
      <path d="M46,110 Q10,104 12,64 Q14,36 36,34" stroke="url(#g-${k}-body)" stroke-width="15" fill="none" stroke-linecap="round"/>
      <circle cx="37" cy="34" r="8" fill="${b.cream}"/>
    </g>
    ${leg(90, 'legB2')}${leg(170, 'legF2')}
    <path d="M120,30 C78,28 46,54 44,96 C42,130 68,150 118,150 C168,152 200,130 198,90 C196,54 166,32 120,30 Z"
      fill="url(#g-${k}-body)" ${st}/>
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
        <ellipse cx="182" cy="68" rx="8" ry="9.5" fill="#5fbf8f"/>
        <ellipse cx="182" cy="68" rx="2.6" ry="8" fill="${b.dark}"/>
        <circle cx="179" cy="63" r="2.4" fill="#fff"/>
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
  return `<svg viewBox="0 0 200 212">
  ${defsFor(k, b)}
  <g class="flip">
  <ellipse cx="100" cy="201" rx="58" ry="8" fill="rgba(120,70,30,.16)"/>
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'front', 'back')}
    ${tailF(k, b)}
    <g class="p-head" data-part>${earsF(k, b)}</g>
    <path d="M100,26 C54,26 30,72 28,124 C26,172 56,200 100,200 C144,200 174,172 172,124 C170,72 146,26 100,26 Z"
      fill="url(#g-${k}-body)" ${st}/>
    <path d="M100,30 C70,30 48,58 44,92 Q72,74 100,74 Q128,74 156,92 C152,58 130,30 100,30 Z" fill="${b.light}" opacity=".35"/>
    <path d="M32,150 C40,186 64,200 100,200 C136,200 160,186 168,150 Q100,178 32,150 Z" fill="${b.deep}" opacity=".18"/>
    <path d="M100,86 C76,86 62,102 60,128 C58,166 74,196 100,196 C126,196 142,166 140,128 C138,102 124,86 100,86 Z"
      fill="url(#g-${k}-cream)"/>
    <ellipse cx="30" cy="142" rx="11" ry="16" fill="url(#g-${k}-body)" ${st} transform="rotate(14 30 142)"/>
    <ellipse cx="170" cy="142" rx="11" ry="16" fill="url(#g-${k}-body)" ${st} transform="rotate(-14 170 142)"/>
    <path d="M42,164 Q100,186 158,164 L158,176 Q100,199 42,176 Z" fill="url(#g-${k}-collar)"/>
    <circle cx="100" cy="184" r="8.5" fill="#ffd766"/><circle cx="97" cy="181" r="3" fill="#fff2c0"/>
    <line x1="100" y1="180" x2="100" y2="187" stroke="#c99b1f" stroke-width="2"/>
    <circle cx="100" cy="190" r="2" fill="#c99b1f"/>
    <ellipse cx="72" cy="197" rx="15" ry="8.5" fill="url(#g-${k}-cream)" ${st}/>
    <ellipse cx="128" cy="197" rx="15" ry="8.5" fill="url(#g-${k}-cream)" ${st}/>
    <path d="M68,193 v6 M76,193 v6 M124,193 v6 M132,193 v6" stroke="rgba(120,80,40,.22)" stroke-width="2" stroke-linecap="round"/>
    <g class="p-face" data-part>
      ${b.blaze ? `<path d="M100,28 C93,46 91,64 93,84 L107,84 C109,64 107,46 100,28 Z" fill="${b.cream}" opacity=".9"/>` : ''}
      ${b.brows ? `<circle cx="74" cy="70" r="4.5" fill="${b.brows}"/><circle cx="126" cy="70" r="4.5" fill="${b.brows}"/>` : ''}
      <g class="p-eyes-open" data-part>
        <circle cx="74" cy="92" r="8" fill="${b.dark}"/><circle cx="71" cy="89" r="2.8" fill="#fff"/><circle cx="77" cy="95" r="1.3" fill="#fff" opacity=".7"/>
        <circle cx="126" cy="92" r="8" fill="${b.dark}"/><circle cx="123" cy="89" r="2.8" fill="#fff"/><circle cx="129" cy="95" r="1.3" fill="#fff" opacity=".7"/>
      </g>
      <g class="p-eyes-happy" data-part fill="none" stroke="${b.dark}" stroke-width="5.5" stroke-linecap="round">
        <path d="M64,94 Q74,84 84,94"/><path d="M116,94 Q126,84 136,94"/>
      </g>
      <g class="p-eyes-sleep" data-part fill="none" stroke="${b.dark}" stroke-width="4.5" stroke-linecap="round">
        <path d="M66,93 Q74,99 82,93"/><path d="M118,93 Q126,99 134,93"/>
      </g>
      <ellipse cx="52" cy="110" rx="9" ry="5.5" fill="${b.blush}" opacity=".8"/>
      <ellipse cx="148" cy="110" rx="9" ry="5.5" fill="${b.blush}" opacity=".8"/>
      <path d="M93,104 Q100,99 107,104 Q107,112 100,112 Q93,112 93,104 Z" fill="${b.dark}"/>
      <ellipse cx="97" cy="104" rx="2" ry="1.2" fill="#8a6a52"/>
      <path d="M100,111 L100,118 M87,120 Q94,127 100,118 Q106,127 113,120" fill="none" stroke="${b.dark}" stroke-width="3.4" stroke-linecap="round"/>
      <path class="p-tongue" data-part d="M93,121 L107,121 Q107,136 100,136 Q93,136 93,121 Z" fill="#ff8fa3"/>
      <line class="p-tongue" x1="100" y1="124" x2="100" y2="131" stroke="#f06e87" stroke-width="1.6"/>
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
  const leg = (x, cls) => `<g class="sleg ${cls}" data-part>
      <path d="M${x - 9},118 L${x - 9},158 Q${x - 9},168 ${x},168 Q${x + 9},168 ${x + 9},158 L${x + 9},118 Z" fill="url(#g-${k}-body)" ${st}/>
      <ellipse cx="${x}" cy="164" rx="10.5" ry="6" fill="url(#g-${k}-cream)"/></g>`;
  return `<svg viewBox="0 0 240 200">
  ${defsFor(k, b)}
  <g class="flip">
  <ellipse cx="120" cy="172" rx="72" ry="8" fill="rgba(120,70,30,.16)"/>
  <g class="p-body" data-part>
    ${clothesLayer(equipped, 'side', 'back')}
    ${tailS(k, b)}
    ${leg(88, 'legB2')}${leg(168, 'legF2')}
    <path d="M120,22 C74,20 40,48 38,92 C36,128 62,148 116,148 C170,150 204,128 202,84 C200,46 168,24 120,22 Z"
      fill="url(#g-${k}-body)" ${st}/>
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
        <circle cx="176" cy="66" r="7.5" fill="${b.dark}"/><circle cx="173" cy="63" r="2.6" fill="#fff"/>
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
      <radialGradient id="g-elf-face" cx="42%" cy="35%" r="80%">
        <stop offset="0%" stop-color="#ffe9a8"/><stop offset="70%" stop-color="#ffd166"/><stop offset="100%" stop-color="#f2b93e"/>
      </radialGradient>
      <linearGradient id="g-elf-dress" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffc9da"/><stop offset="100%" stop-color="#ff9dbb"/>
      </linearGradient>
    </defs>
    <g class="elf-wing-l"><ellipse cx="20" cy="66" rx="17" ry="26" fill="url(#g-elf-wing)" opacity=".9" transform="rotate(18 20 66)"/></g>
    <g class="elf-wing-r"><ellipse cx="100" cy="66" rx="17" ry="26" fill="url(#g-elf-wing)" opacity=".9" transform="rotate(-18 100 66)"/></g>
    <path d="M42,96 Q38,118 32,124 Q60,132 88,124 Q82,118 78,96 Z" fill="url(#g-elf-dress)"/>
    <path d="M36,121 q6,-4 10,2 q6,-6 14,-2 q8,-4 14,2 q4,-6 10,-2 l-2,4 q-24,6 -44,0 Z" fill="#ff8bab"/>
    <circle cx="60" cy="62" r="34" fill="url(#g-elf-face)"/>
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
  return `<svg class="tub" viewBox="0 0 320 260">
    <defs><linearGradient id="g-tub" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b3e2f2"/><stop offset="100%" stop-color="#7cc0dc"/>
    </linearGradient></defs>
    <ellipse cx="160" cy="250" rx="132" ry="9" fill="rgba(60,110,140,.18)"/>
    <path d="M40,130 L280,130 Q296,130 294,146 L282,220 Q278,246 248,246 L72,246 Q42,246 38,220 L26,146 Q24,130 40,130 Z" fill="url(#g-tub)"/>
    <path d="M40,130 L280,130 Q296,130 294,146 L290,168 Q160,186 30,168 L26,146 Q24,130 40,130 Z" fill="#fff" opacity=".18"/>
    <ellipse cx="160" cy="132" rx="132" ry="23" fill="#c8e9f5"/>
    <ellipse cx="160" cy="130" rx="118" ry="17" fill="#e9f7fd"/>
    <ellipse cx="120" cy="126" rx="40" ry="7" fill="#fff" opacity=".8"/>
    <circle cx="70" cy="124" r="12" fill="#fff" opacity=".95"/><circle cx="92" cy="132" r="9" fill="#fff" opacity=".9"/>
    <circle cx="238" cy="126" r="11" fill="#fff" opacity=".95"/><circle cx="256" cy="134" r="8" fill="#fff" opacity=".85"/>
    <path d="M58,246 l-9,11 M262,246 l9,11" stroke="#6faecb" stroke-width="9" stroke-linecap="round"/>
    <circle cx="296" cy="110" r="8" fill="#ffd766"/>
    <path d="M296,110 q16,-5 15,-22" stroke="#ffd766" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="311" cy="84" r="5" fill="#ffe9a8"/>
  </svg>`;
}

export function bowlSVG(kind) {
  const hi = kind === 'water' ? '#8cc6ec' : '#ff8ba6';
  const lo = kind === 'water' ? '#4c94c8' : '#e04a6e';
  const inner = kind === 'water'
    ? '<ellipse cx="60" cy="34" rx="34" ry="9" fill="#bfe4f2"/><path d="M40,33 q8,4 16,0 q8,-4 16,0" stroke="#8fd0ec" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="48" cy="31" rx="9" ry="2.5" fill="#fff" opacity=".8"/>'
    : '<ellipse cx="60" cy="34" rx="34" ry="9" fill="#7a5232"/><g class="kibble" opacity="0"><circle cx="48" cy="33" r="5.5" fill="#cf9256"/><circle cx="61" cy="35" r="5.5" fill="#ba7c42"/><circle cx="73" cy="32" r="5.5" fill="#cf9256"/><circle cx="55" cy="30" r="4.5" fill="#dfa268"/></g>';
  return `<svg viewBox="0 0 120 70">
    <defs><linearGradient id="g-bowl-${kind}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${hi}"/><stop offset="100%" stop-color="${lo}"/>
    </linearGradient></defs>
    <ellipse cx="60" cy="63" rx="42" ry="5.5" fill="rgba(120,70,30,.16)"/>
    <path d="M18,32 L102,32 Q108,32 106,40 L100,56 Q98,64 88,64 L32,64 Q22,64 20,56 L14,40 Q12,32 18,32 Z" fill="url(#g-bowl-${kind})"/>
    <ellipse cx="60" cy="33" rx="44" ry="11" fill="url(#g-bowl-${kind})"/>
    ${inner}
    <ellipse cx="38" cy="50" rx="7" ry="10" fill="#fff" opacity=".22" transform="rotate(14 38 50)"/>
  </svg>`;
}

/* ---------- 家具（2.5D：顶面+前面）---------- */
export const FURNI = [
  { id: 'bed', name: '温暖狗窝', price: 15, w: 26, zone: 'floor', use: 'sleep',
    svg: `<svg viewBox="0 0 140 104">
      <defs><linearGradient id="g-bed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e3ac74"/><stop offset="100%" stop-color="#b57e46"/>
      </linearGradient></defs>
      <ellipse cx="70" cy="96" rx="60" ry="7" fill="rgba(120,70,30,.18)"/>
      <path d="M10,58 Q10,78 24,86 Q44,96 70,96 Q96,96 116,86 Q130,78 130,58 L130,50 L10,50 Z" fill="url(#g-bed)"/>
      <ellipse cx="70" cy="50" rx="60" ry="22" fill="#c98f55"/>
      <ellipse cx="70" cy="52" rx="50" ry="17" fill="#8a5f36"/>
      <ellipse cx="70" cy="54" rx="46" ry="15" fill="#fff4e0"/>
      <ellipse cx="70" cy="56" rx="38" ry="11" fill="#fffaf0"/>
      <path d="M32,52 Q70,42 108,52 L108,58 Q70,50 32,58 Z" fill="#f2a0a0"/>
      <path d="M14,64 Q10,58 16,54 M126,64 Q130,58 124,54" stroke="#9c6a3a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="42" cy="76" rx="6" ry="12" fill="#fff" opacity=".15" transform="rotate(18 42 76)"/>
    </svg>` },
  { id: 'cushion', name: '软软坐垫', price: 10, w: 22, zone: 'floor', use: 'sit',
    svg: `<svg viewBox="0 0 140 92">
      <defs><linearGradient id="g-cush" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d2f2e4"/><stop offset="100%" stop-color="#93cbb4"/>
      </linearGradient></defs>
      <ellipse cx="70" cy="83" rx="56" ry="6.5" fill="rgba(120,70,30,.18)"/>
      <path d="M14,52 Q14,70 34,76 Q70,86 106,76 Q126,70 126,52 L126,44 L14,44 Z" fill="#a3d8c2"/>
      <ellipse cx="70" cy="44" rx="56" ry="22" fill="url(#g-cush)"/>
      <path d="M34,38 Q70,28 106,38 M28,52 Q70,62 112,52" stroke="#8bc4ab" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="70" cy="44" r="6" fill="#8bc4ab"/><circle cx="68" cy="42" r="2" fill="#d2f2e4"/>
    </svg>` },
  { id: 'ball', name: '彩色小球', price: 8, w: 12, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 80 80">
      <defs><radialGradient id="g-ball" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#ffb3ab"/><stop offset="60%" stop-color="#ff8a80"/><stop offset="100%" stop-color="#d95c52"/>
      </radialGradient></defs>
      <ellipse cx="40" cy="73" rx="26" ry="4" fill="rgba(120,70,30,.18)"/>
      <circle cx="40" cy="40" r="28" fill="url(#g-ball)"/>
      <path d="M15,26 A28,28 0 0,1 65,26 L58,36 A20,20 0 0,0 22,36 Z" fill="#fff" opacity=".9"/>
      <path d="M40,32 l2.6,5.4 6,.9 -4.3,4.2 1,5.9 -5.3,-2.8 -5.3,2.8 1,-5.9 -4.3,-4.2 6,-.9 Z" fill="#ffd166"/>
      <ellipse cx="30" cy="24" rx="7" ry="4.5" fill="#fff" opacity=".65" transform="rotate(-24 30 24)"/>
    </svg>` },
  { id: 'yarn', name: '毛线球', price: 8, w: 12, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 80 80">
      <defs><radialGradient id="g-yarn" cx="38%" cy="32%" r="80%">
        <stop offset="0%" stop-color="#fcc4d8"/><stop offset="100%" stop-color="#df7ba2"/>
      </radialGradient></defs>
      <ellipse cx="38" cy="71" rx="24" ry="4" fill="rgba(120,70,30,.18)"/>
      <circle cx="38" cy="42" r="26" fill="url(#g-yarn)"/>
      <path d="M16,32 Q38,20 60,32 M14,44 Q38,34 62,44 M18,56 Q38,48 58,56" stroke="#dc6f9a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M62,54 Q76,60 74,72" stroke="#dc6f9a" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="28" cy="28" rx="7" ry="4.5" fill="#fff" opacity=".5" transform="rotate(-24 28 28)"/>
    </svg>` },
  { id: 'bone', name: '骨头玩具', price: 10, w: 14, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 110 60">
      <defs><linearGradient id="g-bone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffdf6"/><stop offset="100%" stop-color="#e5d5ba"/>
      </linearGradient></defs>
      <ellipse cx="55" cy="53" rx="38" ry="4" fill="rgba(120,70,30,.18)"/>
      <circle cx="22" cy="20" r="12" fill="url(#g-bone)"/><circle cx="22" cy="38" r="12" fill="url(#g-bone)"/>
      <circle cx="88" cy="20" r="12" fill="url(#g-bone)"/><circle cx="88" cy="38" r="12" fill="url(#g-bone)"/>
      <rect x="22" y="18" width="66" height="22" rx="10" fill="url(#g-bone)"/>
      <ellipse cx="40" cy="24" rx="12" ry="4" fill="#fff" opacity=".8"/>
    </svg>` },
  { id: 'plant', name: '小盆栽', price: 12, w: 15, zone: 'floor', use: null,
    svg: `<svg viewBox="0 0 90 120">
      <defs><linearGradient id="g-pot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eb9a68"/><stop offset="100%" stop-color="#bd6c40"/>
      </linearGradient></defs>
      <ellipse cx="45" cy="114" rx="28" ry="4.5" fill="rgba(120,70,30,.18)"/>
      <path d="M45,62 Q20,52 22,24 Q46,32 45,62 Z" fill="#9ad39a"/>
      <path d="M45,62 Q70,52 68,24 Q44,32 45,62 Z" fill="#6fb56f"/>
      <path d="M45,66 Q45,40 45,18" stroke="#5fa55f" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M45,18 Q34,10 36,0 Q50,4 45,18 Z" fill="#9ad39a"/>
      <path d="M24,72 L66,72 L60,110 Q59,116 52,116 L38,116 Q31,116 30,110 Z" fill="url(#g-pot)"/>
      <ellipse cx="45" cy="72" rx="21" ry="6" fill="#5e4226"/>
      <rect x="20" y="66" width="50" height="12" rx="6" fill="#d98354"/>
      <ellipse cx="34" cy="80" rx="4" ry="10" fill="#fff" opacity=".25" transform="rotate(6 34 80)"/>
    </svg>` },
  { id: 'lamp', name: '暖暖小灯', price: 20, w: 16, zone: 'floor', use: null,
    svg: `<svg viewBox="0 0 100 190">
      <defs><linearGradient id="g-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffd9ac"/><stop offset="100%" stop-color="#ffb877"/>
      </linearGradient></defs>
      <ellipse class="glowlight" cx="50" cy="42" rx="48" ry="42" fill="rgba(255,220,130,.55)"/>
      <ellipse cx="50" cy="183" rx="30" ry="5.5" fill="rgba(120,70,30,.18)"/>
      <path d="M26,14 L74,14 L84,66 L16,66 Z" fill="url(#g-shade)"/>
      <path d="M26,14 L74,14 L76,26 L24,26 Z" fill="#ffe4c4"/>
      <ellipse cx="50" cy="66" rx="34" ry="5" fill="#f0a45f"/>
      <line x1="50" y1="70" x2="50" y2="172" stroke="#a8703c" stroke-width="7"/>
      <ellipse cx="50" cy="176" rx="27" ry="8" fill="#a8703c"/>
      <ellipse cx="50" cy="173" rx="27" ry="7" fill="#c1884f"/>
    </svg>` },
  { id: 'frame', name: '爱心画框', price: 15, w: 15, zone: 'wall', use: null,
    svg: `<svg viewBox="0 0 100 100">
      <defs><linearGradient id="g-frame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e3ac74"/><stop offset="100%" stop-color="#b57e46"/>
      </linearGradient></defs>
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#g-frame)"/>
      <rect x="14" y="14" width="72" height="72" rx="7" fill="#8a5f36" opacity=".5"/>
      <rect x="17" y="17" width="66" height="66" rx="6" fill="#fff9ef"/>
      <path d="M50,68 C30,52 26,38 38,32 C46,28 50,36 50,38 C50,36 54,28 62,32 C74,38 70,52 50,68 Z" fill="#ff8fa3"/>
      <path d="M42,36 a5,5 0 0,1 6,3" stroke="#ffc4cf" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>` },
];

/* ---------- 房间 2.5D：三面墙透视 ---------- */
export function roomBgSVG() {
  let planks = '';
  // 地板：向灭点收敛的木板
  for (let i = 0; i <= 8; i++) {
    const tx = 240 + i * 140, bx = -160 + i * 240;
    planks += `<line x1="${tx}" y1="430" x2="${bx}" y2="1000" stroke="#c98f55" stroke-width="4" opacity=".55"/>`;
  }
  for (const y of [520, 640, 790, 940]) {
    planks += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#c98f55" stroke-width="4" opacity=".55"/>`;
  }
  let scallop = '';
  for (let a = 0; a < 360; a += 15) {
    const rx = 300 * Math.cos(a * Math.PI / 180), ry = 112 * Math.sin(a * Math.PI / 180);
    scallop += `<circle cx="${760 + rx}" cy="${790 + ry}" r="12" fill="#d5f0e4"/>`;
  }
  return `<svg id="room-bg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g-wallB" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffeacc"/><stop offset="100%" stop-color="#fcd9ae"/>
      </linearGradient>
      <linearGradient id="g-wallL" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#eebe8e"/><stop offset="100%" stop-color="#f8d3a4"/>
      </linearGradient>
      <linearGradient id="g-wallR" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stop-color="#e8b686"/><stop offset="100%" stop-color="#f5cf9e"/>
      </linearGradient>
      <linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e2ab72"/><stop offset="55%" stop-color="#ecbc86"/><stop offset="100%" stop-color="#f4ca97"/>
      </linearGradient>
      <linearGradient id="g-beam" x1="0" y1="0" x2=".6" y2="1">
        <stop offset="0%" stop-color="#fff3c9" stop-opacity=".5"/><stop offset="100%" stop-color="#fff3c9" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="g-curtain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffc9a3"/><stop offset="100%" stop-color="#f0a06e"/>
      </linearGradient>
      <linearGradient id="g-door" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d9a066"/><stop offset="100%" stop-color="#b57e46"/>
      </linearGradient>
      <radialGradient id="g-vig" cx="50%" cy="42%" r="78%">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="80%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#7a4020" stop-opacity=".2"/>
      </radialGradient>
      <linearGradient id="g-rug" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#cdeede"/><stop offset="100%" stop-color="#a4d6bf"/>
      </linearGradient>
    </defs>
    <rect x="200" y="0" width="1200" height="430" fill="url(#g-wallB)"/>
    <polygon points="0,0 200,0 200,430 0,600" fill="url(#g-wallL)"/>
    <polygon points="1400,0 1600,0 1600,600 1400,430" fill="url(#g-wallR)"/>
    <polygon points="0,600 200,430 1400,430 1600,600 1600,1000 0,1000" fill="url(#g-floor)"/>
    ${planks}
    <rect x="200" y="418" width="1200" height="16" rx="4" fill="#d9a066"/>
    <polygon points="0,600 200,430 200,446 24,612" fill="#cc9257"/>
    <polygon points="1600,600 1400,430 1400,446 1576,612" fill="#c58a50"/>
    <circle cx="700" cy="120" r="16" fill="#ffd6ab" opacity=".4"/>
    <circle cx="960" cy="220" r="13" fill="#ffd6ab" opacity=".4"/>
    <circle cx="1180" cy="110" r="14" fill="#ffd6ab" opacity=".4"/>
    <circle cx="820" cy="320" r="12" fill="#ffd6ab" opacity=".4"/>
    <circle cx="560" cy="250" r="12" fill="#ffd6ab" opacity=".4"/>
    <g>
      <rect x="270" y="60" width="330" height="300" rx="22" fill="#fffdf8"/>
      <rect x="286" y="76" width="298" height="268" rx="14" fill="#b5e0f5"/>
      <rect x="286" y="76" width="298" height="130" rx="14" fill="#c8eafa"/>
      <circle cx="370" cy="150" r="36" fill="#ffe58e"/><circle cx="370" cy="150" r="46" fill="#ffe58e" opacity=".35"/>
      <ellipse cx="490" cy="170" rx="50" ry="20" fill="#fff" opacity=".95"/>
      <ellipse cx="450" cy="182" rx="32" ry="15" fill="#fff" opacity=".9"/>
      <ellipse cx="360" cy="280" rx="40" ry="15" fill="#fff" opacity=".75"/>
      <line x1="435" y1="76" x2="435" y2="344" stroke="#fffdf8" stroke-width="13"/>
      <line x1="286" y1="212" x2="584" y2="212" stroke="#fffdf8" stroke-width="13"/>
      <path d="M252,52 Q268,50 276,64 L288,160 Q294,240 276,356 L252,364 Q272,220 262,120 Z" fill="url(#g-curtain)"/>
      <path d="M618,52 Q602,50 594,64 L582,160 Q576,240 594,356 L618,364 Q598,220 608,120 Z" fill="url(#g-curtain)"/>
      <path d="M252,48 L618,48 L618,70 Q435,88 252,70 Z" fill="#f0a06e"/>
      <rect x="256" y="356" width="358" height="22" rx="11" fill="#f2c493"/>
    </g>
    <polygon points="300,440 700,1000 1200,1000 620,440" fill="url(#g-beam)"/>
    <g id="door-park" style="cursor:pointer">
      <rect x="1180" y="128" width="176" height="302" rx="14" fill="url(#g-door)"/>
      <rect x="1194" y="142" width="148" height="276" rx="10" fill="#c98f55"/>
      <rect x="1206" y="154" width="124" height="118" rx="8" fill="#e3ac74"/>
      <rect x="1206" y="284" width="124" height="120" rx="8" fill="#e3ac74"/>
      <circle cx="1322" cy="286" r="9" fill="#ffd766"/>
      <g transform="translate(1268,218)">
        <ellipse rx="46" ry="30" fill="#fff9ef"/>
        <g fill="#c98f55"><circle cx="-12" cy="-8" r="5.5"/><circle cx="0" cy="-12" r="5.5"/><circle cx="12" cy="-8" r="5.5"/><ellipse cy="4" rx="9" ry="7"/></g>
        <text y="22" text-anchor="middle" font-size="15" fill="#8a5a36" font-weight="bold">去公园</text>
      </g>
      <ellipse cx="1268" cy="446" rx="86" ry="18" fill="#8fc7ae"/>
      <ellipse cx="1268" cy="443" rx="86" ry="16" fill="#bfe8d8"/>
    </g>
    <g>
      <rect x="700" y="120" width="240" height="18" rx="9" fill="#d9a066"/>
      <rect x="700" y="131" width="240" height="7" rx="3" fill="#b57e46"/>
      <rect x="722" y="66" width="24" height="54" rx="5" fill="#f2a0a0"/>
      <rect x="752" y="56" width="24" height="64" rx="5" fill="#8fc7e8"/>
      <rect x="782" y="76" width="24" height="44" rx="5" fill="#a5d6a7"/>
      <circle cx="852" cy="92" r="21" fill="#8fca8f"/><circle cx="842" cy="82" r="9" fill="#b0dfb0"/>
      <rect x="838" y="106" width="26" height="16" rx="4" fill="#e08e5e"/>
      <rect x="884" y="60" width="46" height="58" rx="7" fill="#fff9ef" stroke="#d9a066" stroke-width="5"/>
      <circle cx="907" cy="84" r="12" fill="#f09f51"/>
      <path d="M900,82 a7,7 0 1,1 14,0" fill="#fff4e3"/>
    </g>
    <g>
      <path d="M108,332 Q88,300 108,272 Q128,300 108,332 Z" fill="#9ad39a"/>
      <path d="M108,340 L108,388" stroke="#5fa55f" stroke-width="6" stroke-linecap="round"/>
      <path d="M82,394 L134,394 L127,446 Q126,454 116,454 L100,454 Q90,454 89,446 Z" fill="#d98354"/>
      <ellipse cx="108" cy="394" rx="26" ry="7" fill="#5e4226"/>
    </g>
    <ellipse cx="760" cy="790" rx="322" ry="124" fill="#8fc7ae"/>
    ${scallop}
    <ellipse cx="760" cy="790" rx="300" ry="112" fill="url(#g-rug)"/>
    <ellipse cx="760" cy="790" rx="228" ry="82" fill="none" stroke="#fff6ea" stroke-width="7" stroke-dasharray="1 24" stroke-linecap="round"/>
    <ellipse cx="760" cy="790" rx="156" ry="54" fill="none" stroke="#8fc7ae" stroke-width="5"/>
    <g fill="#8fc7ae"><circle cx="740" cy="782" r="7"/><circle cx="760" cy="774" r="7"/><circle cx="780" cy="782" r="7"/><ellipse cx="760" cy="800" rx="12" ry="9"/></g>
    <rect width="1600" height="1000" fill="url(#g-vig)"/>
  </svg>`;
}

/* ---------- 公园 2.5D ---------- */
export function parkBgSVG() {
  let far = '';
  for (let i = 0; i < 7; i++) {
    const x = 60 + i * 240 + (i % 2) * 60;
    far += `<g transform="translate(${x},316)">
      <line y1="0" y2="34" stroke="#9c7248" stroke-width="8"/>
      <circle cy="-18" r="34" fill="#8fca8f"/><circle cx="-20" cy="-4" r="22" fill="#7fbc7f"/><circle cx="20" cy="-4" r="22" fill="#9ad39a"/>
    </g>`;
  }
  let fence = '';
  for (let i = 0; i < 27; i++) {
    const x = 10 + i * 60;
    fence += `<rect x="${x}" y="352" width="14" height="66" rx="6" fill="#e8c288"/>`;
  }
  let flowers = '';
  const fpos = [[120, 560], [300, 700], [90, 860], [1400, 590], [1510, 760], [1330, 900], [520, 920], [1120, 940], [240, 620], [1460, 680]];
  fpos.forEach(([x, y], i) => {
    const c = ['#ff9db5', '#ffd766', '#a8d8f0', '#f2a0c4'][i % 4];
    flowers += `<g transform="translate(${x},${y})" class="sway">
      <line y1="0" y2="26" stroke="#5fa55f" stroke-width="4"/>
      <circle r="8" fill="${c}"/><circle r="3.4" fill="#fff8e0"/>
      <ellipse cx="7" cy="14" rx="7" ry="3" fill="#6fb56f" transform="rotate(-24 7 14)"/>
    </g>`;
  });
  return `<svg id="room-bg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8fd0f0"/><stop offset="100%" stop-color="#d8f0fb"/>
      </linearGradient>
      <linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9fd68f"/><stop offset="50%" stop-color="#b2e0a0"/><stop offset="100%" stop-color="#c4eab2"/>
      </linearGradient>
      <linearGradient id="g-path" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f0dbb0"/><stop offset="100%" stop-color="#f7e8c8"/>
      </linearGradient>
      <radialGradient id="g-pvig" cx="50%" cy="42%" r="78%">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="82%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#2f5a2f" stop-opacity=".16"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="420" fill="url(#g-sky)"/>
    <circle cx="1360" cy="110" r="52" fill="#ffe58e"/><circle cx="1360" cy="110" r="68" fill="#ffe58e" opacity=".35"/>
    <g class="cloudmove"><ellipse cx="300" cy="110" rx="80" ry="28" fill="#fff" opacity=".95"/>
      <ellipse cx="360" cy="124" rx="52" ry="20" fill="#fff" opacity=".9"/></g>
    <g class="cloudmove2"><ellipse cx="900" cy="80" rx="66" ry="24" fill="#fff" opacity=".9"/>
      <ellipse cx="850" cy="94" rx="40" ry="16" fill="#fff" opacity=".85"/></g>
    <ellipse cx="800" cy="352" rx="900" ry="60" fill="#7fbc7f"/>
    ${far}
    ${fence}
    <rect x="0" y="410" width="1600" height="14" rx="7" fill="#d9a970"/>
    <polygon points="0,424 1600,424 1600,1000 0,1000" fill="url(#g-grass)"/>
    <polygon points="700,424 900,424 1250,1000 350,1000" fill="url(#g-path)"/>
    <polygon points="700,424 714,424 400,1000 350,1000" fill="#e3cb96"/>
    <polygon points="886,424 900,424 1250,1000 1200,1000" fill="#e3cb96"/>
    <ellipse cx="660" cy="560" rx="10" ry="5" fill="#e3cb96"/>
    <ellipse cx="920" cy="700" rx="12" ry="6" fill="#e3cb96"/>
    <ellipse cx="700" cy="880" rx="14" ry="7" fill="#e3cb96"/>
    <g transform="translate(170,430)">
      <path d="M0,0 L26,-140 Q30,-160 46,-160 Q62,-160 66,-140 L92,0 Q46,16 0,0 Z" fill="#a5713f"/>
      <circle cx="46" cy="-210" r="88" fill="#8fca8f"/><circle cx="-16" cy="-160" r="62" fill="#7fbc7f"/>
      <circle cx="112" cy="-166" r="66" fill="#9ad39a"/><circle cx="46" cy="-136" r="56" fill="#aade9c"/>
      <circle cx="8" cy="-208" r="12" fill="#ff9db5"/><circle cx="96" cy="-228" r="12" fill="#ffd766"/><circle cx="60" cy="-150" r="10" fill="#ff9db5"/>
    </g>
    <g transform="translate(1370,442) scale(.9)">
      <path d="M0,0 L26,-140 Q30,-160 46,-160 Q62,-160 66,-140 L92,0 Q46,16 0,0 Z" fill="#a5713f"/>
      <circle cx="46" cy="-210" r="88" fill="#9ad39a"/><circle cx="-16" cy="-160" r="62" fill="#8fca8f"/>
      <circle cx="112" cy="-166" r="66" fill="#aade9c"/><circle cx="46" cy="-136" r="56" fill="#8fca8f"/>
      <circle cx="20" cy="-190" r="11" fill="#a8d8f0"/><circle cx="90" cy="-210" r="11" fill="#f2a0c4"/>
    </g>
    <g transform="translate(1080,520)">
      <ellipse rx="120" ry="44" fill="#8fd0e8"/>
      <ellipse rx="104" ry="36" fill="#aadff2"/>
      <ellipse cx="-30" cy="-8" rx="34" ry="9" fill="#d8f2fb" opacity=".9"/>
      <path d="M-116,10 Q-124,-10 -108,-16 M116,10 Q124,-10 108,-16" stroke="#7fbc7f" stroke-width="6" fill="none"/>
      <g transform="translate(40,-6)"><ellipse rx="13" ry="9" fill="#ffd766"/><circle cx="11" cy="-7" r="7" fill="#ffd766"/>
        <path d="M16,-8 l6,2 -6,2" fill="#f0a45f"/><circle cx="13" cy="-9" r="1.6" fill="#5b3a29"/></g>
    </g>
    <g transform="translate(420,620)">
      <ellipse cx="0" cy="46" rx="66" ry="10" fill="rgba(60,90,50,.18)"/>
      <path d="M-60,10 L60,10 Q70,10 70,20 L70,24 Q70,34 60,34 L-60,34 Q-70,34 -70,24 L-70,20 Q-70,10 -60,10 Z" fill="#d9a066"/>
      <rect x="-58" y="-14" width="116" height="18" rx="8" fill="#e3ac74"/>
      <path d="M-52,34 L-52,52 M52,34 L52,52" stroke="#a5713f" stroke-width="9" stroke-linecap="round"/>
    </g>
    ${flowers}
    <g class="bushclump" transform="translate(620,940)">
      <circle r="26" fill="#8fca8f"/><circle cx="30" cy="4" r="20" fill="#9ad39a"/><circle cx="-28" cy="6" r="18" fill="#7fbc7f"/>
    </g>
    <rect width="1600" height="1000" fill="url(#g-pvig)"/>
  </svg>`;
}

/* 公园的球 */
export function fetchBallSVG() {
  return `<svg viewBox="0 0 60 60">
    <defs><radialGradient id="g-fball" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#ffe08a"/><stop offset="60%" stop-color="#ffc94d"/><stop offset="100%" stop-color="#e8a52e"/>
    </radialGradient></defs>
    <circle cx="30" cy="30" r="24" fill="url(#g-fball)"/>
    <path d="M8,24 A24,24 0 0,1 52,24" fill="none" stroke="#e8575f" stroke-width="5"/>
    <ellipse cx="21" cy="17" rx="6" ry="4" fill="#fff" opacity=".7" transform="rotate(-24 21 17)"/>
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
