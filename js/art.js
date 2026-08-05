/* ============ 全部矢量美术 v2：胖胖治愈风 + 渐变光影 ============ */

export const BREEDS = {
  shiba: {
    label: '柴柴', main: '#f09f51', light: '#ffc180', deep: '#d9853c',
    cream: '#fff4e3', creamHi: '#fffdf6', earIn: '#c1753f',
    dark: '#5b3a29', collar: '#f25d7e', collarHi: '#ff8ba6', blush: '#ffb0ba',
    ear: 'point', tail: 'curl', brows: '#fff'
  },
  corgi: {
    label: '小柯基', main: '#f7b06b', light: '#ffd096', deep: '#e0914b',
    cream: '#fff8ee', creamHi: '#ffffff', earIn: '#e78a5a',
    dark: '#59372a', collar: '#5ba8de', collarHi: '#8cc6ec', blush: '#ffb9c0',
    ear: 'big', tail: 'nub', brows: '#fff', blaze: true
  },
  golden: {
    label: '小金毛', main: '#eec379', light: '#fadfa2', deep: '#d3a253',
    cream: '#fbf0d7', creamHi: '#fffcf2', earIn: '#d8a856',
    dark: '#5d4126', collar: '#7fc8a9', collarHi: '#a8dfc7', blush: '#ffc0b8',
    ear: 'floppy', tail: 'feather', brows: '#e8c887'
  },
  bichon: {
    label: '云朵犬', main: '#fdf9f2', light: '#ffffff', deep: '#eadbc8',
    cream: '#fffdf8', creamHi: '#ffffff', earIn: '#f0dfc9',
    dark: '#6b5138', collar: '#b28fd9', collarHi: '#cfb3ea', blush: '#ffb3bd',
    ear: 'puff', tail: 'puff', brows: null, outline: '#e5d3ba'
  }
};

function ears(k, b) {
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3"` : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".45"`;
  if (b.ear === 'floppy') return `
    <g class="p-earL" data-part>
      <path d="M42,44 Q18,52 22,96 Q24,120 44,116 Q60,112 58,80 Q56,54 42,44 Z" fill="url(#g-${k}-ear)" ${st}/>
    </g>
    <g class="p-earR" data-part>
      <path d="M158,44 Q182,52 178,96 Q176,120 156,116 Q140,112 142,80 Q144,54 158,44 Z" fill="url(#g-${k}-ear)" ${st}/>
    </g>`;
  if (b.ear === 'puff') return `
    <g class="p-earL" data-part>
      <circle cx="46" cy="46" r="22" fill="url(#g-${k}-body)" ${st}/>
      <circle cx="34" cy="60" r="13" fill="url(#g-${k}-body)" ${st}/>
    </g>
    <g class="p-earR" data-part>
      <circle cx="154" cy="46" r="22" fill="url(#g-${k}-body)" ${st}/>
      <circle cx="166" cy="60" r="13" fill="url(#g-${k}-body)" ${st}/>
    </g>`;
  const big = b.ear === 'big';
  const tipY = big ? 4 : 16, spread = big ? 8 : 0;
  return `
    <g class="p-earL" data-part>
      <path d="M44,62 Q${34 - spread},${tipY + 12} ${58 - spread},${tipY} Q84,${tipY - 3} 88,48 Q66,60 44,62 Z"
        fill="url(#g-${k}-body)" ${st}/>
      <path d="M53,56 Q${47 - spread / 2},${tipY + 22} ${63 - spread / 2},${tipY + 12} Q78,${tipY + 10} 80,46 Q66,55 53,56 Z" fill="${b.earIn}"/>
    </g>
    <g class="p-earR" data-part>
      <path d="M156,62 Q${166 + spread},${tipY + 12} ${142 + spread},${tipY} Q116,${tipY - 3} 112,48 Q134,60 156,62 Z"
        fill="url(#g-${k}-body)" ${st}/>
      <path d="M147,56 Q${153 + spread / 2},${tipY + 22} ${137 + spread / 2},${tipY + 12} Q122,${tipY + 10} 120,46 Q134,55 147,56 Z" fill="${b.earIn}"/>
    </g>`;
}

function tail(k, b) {
  const st = b.outline ? `stroke="${b.outline}" stroke-width="3"` : '';
  if (b.tail === 'curl') return `
    <g class="p-tail" data-part>
      <circle cx="163" cy="118" r="18" fill="url(#g-${k}-body)"/>
      <circle cx="168" cy="113" r="9.5" fill="${b.cream}"/>
    </g>`;
  if (b.tail === 'nub') return `
    <ellipse class="p-tail" data-part cx="166" cy="138" rx="12" ry="10" fill="url(#g-${k}-body)"/>`;
  if (b.tail === 'puff') return `
    <g class="p-tail" data-part>
      <circle cx="164" cy="124" r="16" fill="url(#g-${k}-body)" ${st}/>
      <circle cx="174" cy="113" r="9" fill="url(#g-${k}-body)" ${st}/>
    </g>`;
  return `
    <g class="p-tail" data-part>
      <path d="M160,132 Q196,110 188,70" stroke="url(#g-${k}-body)" stroke-width="19" stroke-linecap="round" fill="none"/>
      <path d="M181,92 Q194,78 188,70 Q180,64 174,80 Z" fill="${b.cream}"/>
      <circle cx="187" cy="72" r="11" fill="${b.cream}"/>
    </g>`;
}

/* 胖嘟嘟一体身型：脸占上半身，奶油肚兜连脸颊，小短手 */
export function petSVG(breed) {
  const b = BREEDS[breed];
  const k = breed;
  const st = b.outline
    ? `stroke="${b.outline}" stroke-width="3.5"`
    : `stroke="${b.deep}" stroke-width="2.5" stroke-opacity=".4"`;
  return `<svg viewBox="0 0 200 212">
  <defs>
    <radialGradient id="g-${k}-body" cx="42%" cy="30%" r="85%">
      <stop offset="0%" stop-color="${b.light}"/>
      <stop offset="55%" stop-color="${b.main}"/>
      <stop offset="100%" stop-color="${b.deep}"/>
    </radialGradient>
    <linearGradient id="g-${k}-cream" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${b.creamHi}"/>
      <stop offset="100%" stop-color="${b.cream}"/>
    </linearGradient>
    <linearGradient id="g-${k}-collar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${b.collarHi}"/>
      <stop offset="100%" stop-color="${b.collar}"/>
    </linearGradient>
    <radialGradient id="g-${k}-ear" cx="50%" cy="25%" r="90%">
      <stop offset="0%" stop-color="${b.main}"/>
      <stop offset="100%" stop-color="${b.earIn}"/>
    </radialGradient>
  </defs>
  <g class="flip">
  <ellipse cx="100" cy="201" rx="58" ry="8" fill="rgba(120,70,30,.16)"/>
  <g class="p-body" data-part>
    ${tail(k, b)}
    <g class="p-head" data-part>${ears(k, b)}</g>
    <path d="M100,26 C54,26 30,72 28,124 C26,172 56,200 100,200 C144,200 174,172 172,124 C170,72 146,26 100,26 Z"
      fill="url(#g-${k}-body)" ${st}/>
    <path d="M100,30 C70,30 48,58 44,92 Q72,74 100,74 Q128,74 156,92 C152,58 130,30 100,30 Z"
      fill="${b.light}" opacity=".35"/>
    <path d="M100,86 C76,86 62,102 60,128 C58,166 74,196 100,196 C126,196 142,166 140,128 C138,102 124,86 100,86 Z"
      fill="url(#g-${k}-cream)"/>
    <ellipse cx="30" cy="142" rx="11" ry="16" fill="url(#g-${k}-body)" ${st} transform="rotate(14 30 142)"/>
    <ellipse cx="170" cy="142" rx="11" ry="16" fill="url(#g-${k}-body)" ${st} transform="rotate(-14 170 142)"/>
    <path d="M42,164 Q100,186 158,164 L158,176 Q100,199 42,176 Z" fill="url(#g-${k}-collar)"/>
    <circle cx="100" cy="184" r="8.5" fill="#ffd766"/>
    <circle cx="97" cy="181" r="3" fill="#fff2c0"/>
    <line x1="100" y1="180" x2="100" y2="187" stroke="#c99b1f" stroke-width="2"/>
    <circle cx="100" cy="190" r="2" fill="#c99b1f"/>
    <ellipse cx="72" cy="197" rx="15" ry="8.5" fill="url(#g-${k}-cream)" ${st}/>
    <ellipse cx="128" cy="197" rx="15" ry="8.5" fill="url(#g-${k}-cream)" ${st}/>
    <path d="M68,193 v6 M76,193 v6 M124,193 v6 M132,193 v6" stroke="rgba(120,80,40,.22)" stroke-width="2" stroke-linecap="round"/>
    <g class="p-face" data-part>
      ${b.blaze ? `<path d="M100,28 C93,46 91,64 93,84 L107,84 C109,64 107,46 100,28 Z" fill="${b.cream}" opacity=".9"/>` : ''}
      ${b.brows ? `<circle cx="74" cy="70" r="4.5" fill="${b.brows}"/><circle cx="126" cy="70" r="4.5" fill="${b.brows}"/>` : ''}
      <g class="p-eyes-open" data-part>
        <circle cx="74" cy="92" r="8" fill="${b.dark}"/>
        <circle cx="71" cy="89" r="2.8" fill="#fff"/><circle cx="77" cy="95" r="1.3" fill="#fff" opacity=".7"/>
        <circle cx="126" cy="92" r="8" fill="${b.dark}"/>
        <circle cx="123" cy="89" r="2.8" fill="#fff"/><circle cx="129" cy="95" r="1.3" fill="#fff" opacity=".7"/>
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
    </g>
  </g></g></svg>`;
}

/* 小精灵：真正的小仙子 */
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
    <defs>
      <linearGradient id="g-tub" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b3e2f2"/><stop offset="100%" stop-color="#7cc0dc"/>
      </linearGradient>
    </defs>
    <ellipse cx="160" cy="250" rx="132" ry="9" fill="rgba(60,110,140,.18)"/>
    <path d="M40,130 L280,130 Q296,130 294,146 L282,220 Q278,246 248,246 L72,246 Q42,246 38,220 L26,146 Q24,130 40,130 Z" fill="url(#g-tub)"/>
    <path d="M40,130 L280,130 Q296,130 294,146 L290,168 Q160,186 30,168 L26,146 Q24,130 40,130 Z" fill="#fff" opacity=".18"/>
    <ellipse cx="160" cy="132" rx="132" ry="23" fill="#c8e9f5"/>
    <ellipse cx="160" cy="130" rx="118" ry="17" fill="#e9f7fd"/>
    <ellipse cx="120" cy="126" rx="40" ry="7" fill="#fff" opacity=".8"/>
    <circle cx="70" cy="124" r="12" fill="#fff" opacity=".95"/>
    <circle cx="92" cy="132" r="9" fill="#fff" opacity=".9"/>
    <circle cx="238" cy="126" r="11" fill="#fff" opacity=".95"/>
    <circle cx="256" cy="134" r="8" fill="#fff" opacity=".85"/>
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

/* ---------- 可购买家具 ---------- */
export const FURNI = [
  { id: 'bed', name: '温暖狗窝', price: 15, w: 26, zone: 'floor', use: 'sleep',
    svg: `<svg viewBox="0 0 140 100">
      <defs><linearGradient id="g-bed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e3ac74"/><stop offset="100%" stop-color="#c1884f"/>
      </linearGradient></defs>
      <ellipse cx="70" cy="93" rx="58" ry="6.5" fill="rgba(120,70,30,.16)"/>
      <path d="M14,52 Q14,30 40,30 L100,30 Q126,30 126,52 L126,72 Q126,90 100,90 L40,90 Q14,90 14,72 Z" fill="url(#g-bed)"/>
      <path d="M14,52 Q14,30 40,30 L100,30 Q126,30 126,52 L126,58 Q70,72 14,58 Z" fill="#b0773f"/>
      <ellipse cx="70" cy="62" rx="46" ry="20" fill="#fff4e0"/>
      <ellipse cx="70" cy="60" rx="38" ry="15" fill="#fffaf0"/>
      <path d="M30,58 Q70,44 110,58 L110,66 Q70,54 30,66 Z" fill="#f2a0a0"/>
      <path d="M24,44 q-2,-8 6,-10 M116,44 q2,-8 -6,-10" stroke="#a06a36" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>` },
  { id: 'cushion', name: '软软坐垫', price: 10, w: 22, zone: 'floor', use: 'sit',
    svg: `<svg viewBox="0 0 140 90">
      <defs><linearGradient id="g-cush" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d2f2e4"/><stop offset="100%" stop-color="#a3d8c2"/>
      </linearGradient></defs>
      <ellipse cx="70" cy="81" rx="55" ry="5.5" fill="rgba(120,70,30,.16)"/>
      <path d="M18,50 Q10,26 40,24 Q70,14 100,24 Q130,26 122,50 Q128,72 100,74 Q70,84 40,74 Q12,72 18,50 Z" fill="url(#g-cush)"/>
      <path d="M40,30 Q70,22 100,30 M34,60 Q70,70 106,60" stroke="#8bc4ab" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="70" cy="48" r="6" fill="#8bc4ab"/><circle cx="68" cy="46" r="2" fill="#d2f2e4"/>
    </svg>` },
  { id: 'ball', name: '彩色小球', price: 8, w: 12, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 80 80">
      <defs><radialGradient id="g-ball" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#ffb3ab"/><stop offset="60%" stop-color="#ff8a80"/><stop offset="100%" stop-color="#e56a60"/>
      </radialGradient></defs>
      <ellipse cx="40" cy="73" rx="26" ry="4" fill="rgba(120,70,30,.16)"/>
      <circle cx="40" cy="40" r="28" fill="url(#g-ball)"/>
      <path d="M15,26 A28,28 0 0,1 65,26 L58,36 A20,20 0 0,0 22,36 Z" fill="#fff" opacity=".9"/>
      <path d="M40,32 l2.6,5.4 6,.9 -4.3,4.2 1,5.9 -5.3,-2.8 -5.3,2.8 1,-5.9 -4.3,-4.2 6,-.9 Z" fill="#ffd166"/>
      <ellipse cx="30" cy="24" rx="7" ry="4.5" fill="#fff" opacity=".65" transform="rotate(-24 30 24)"/>
    </svg>` },
  { id: 'yarn', name: '毛线球', price: 8, w: 12, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 80 80">
      <defs><radialGradient id="g-yarn" cx="38%" cy="32%" r="80%">
        <stop offset="0%" stop-color="#fcc4d8"/><stop offset="100%" stop-color="#ec8bb0"/>
      </radialGradient></defs>
      <ellipse cx="38" cy="71" rx="24" ry="4" fill="rgba(120,70,30,.16)"/>
      <circle cx="38" cy="42" r="26" fill="url(#g-yarn)"/>
      <path d="M16,32 Q38,20 60,32 M14,44 Q38,34 62,44 M18,56 Q38,48 58,56" stroke="#dc6f9a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M62,54 Q76,60 74,72" stroke="#dc6f9a" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="28" cy="28" rx="7" ry="4.5" fill="#fff" opacity=".5" transform="rotate(-24 28 28)"/>
    </svg>` },
  { id: 'bone', name: '骨头玩具', price: 10, w: 14, zone: 'floor', use: 'play',
    svg: `<svg viewBox="0 0 110 60">
      <defs><linearGradient id="g-bone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffdf6"/><stop offset="100%" stop-color="#efe2cc"/>
      </linearGradient></defs>
      <ellipse cx="55" cy="53" rx="38" ry="4" fill="rgba(120,70,30,.16)"/>
      <circle cx="22" cy="20" r="12" fill="url(#g-bone)"/><circle cx="22" cy="38" r="12" fill="url(#g-bone)"/>
      <circle cx="88" cy="20" r="12" fill="url(#g-bone)"/><circle cx="88" cy="38" r="12" fill="url(#g-bone)"/>
      <rect x="22" y="18" width="66" height="22" rx="10" fill="url(#g-bone)"/>
      <ellipse cx="40" cy="24" rx="12" ry="4" fill="#fff" opacity=".8"/>
    </svg>` },
  { id: 'plant', name: '小盆栽', price: 12, w: 15, zone: 'floor', use: null,
    svg: `<svg viewBox="0 0 90 120">
      <defs><linearGradient id="g-pot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eb9a68"/><stop offset="100%" stop-color="#c9764a"/>
      </linearGradient></defs>
      <ellipse cx="45" cy="114" rx="28" ry="4.5" fill="rgba(120,70,30,.16)"/>
      <path d="M45,62 Q20,52 22,24 Q46,32 45,62 Z" fill="#9ad39a"/>
      <path d="M45,62 Q70,52 68,24 Q44,32 45,62 Z" fill="#6fb56f"/>
      <path d="M45,66 Q45,40 45,18" stroke="#5fa55f" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M45,18 Q34,10 36,0 Q50,4 45,18 Z" fill="#9ad39a"/>
      <path d="M24,72 L66,72 L60,110 Q59,116 52,116 L38,116 Q31,116 30,110 Z" fill="url(#g-pot)"/>
      <rect x="20" y="66" width="50" height="12" rx="6" fill="#d98354"/>
      <ellipse cx="34" cy="80" rx="4" ry="10" fill="#fff" opacity=".25" transform="rotate(6 34 80)"/>
    </svg>` },
  { id: 'lamp', name: '暖暖小灯', price: 20, w: 16, zone: 'floor', use: null,
    svg: `<svg viewBox="0 0 100 190">
      <defs><linearGradient id="g-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffd9ac"/><stop offset="100%" stop-color="#ffb877"/>
      </linearGradient></defs>
      <ellipse class="glowlight" cx="50" cy="42" rx="48" ry="42" fill="rgba(255,220,130,.55)"/>
      <ellipse cx="50" cy="183" rx="30" ry="5.5" fill="rgba(120,70,30,.16)"/>
      <path d="M26,14 L74,14 L84,66 L16,66 Z" fill="url(#g-shade)"/>
      <path d="M26,14 L74,14 L76,26 L24,26 Z" fill="#ffe4c4"/>
      <ellipse cx="50" cy="66" rx="34" ry="5" fill="#f0a45f"/>
      <line x1="50" y1="70" x2="50" y2="172" stroke="#a8703c" stroke-width="7"/>
      <path d="M24,178 Q50,164 76,178 L76,182 Q50,172 24,182 Z" fill="#a8703c"/>
    </svg>` },
  { id: 'frame', name: '爱心画框', price: 15, w: 15, zone: 'wall', use: null,
    svg: `<svg viewBox="0 0 100 100">
      <defs><linearGradient id="g-frame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e3ac74"/><stop offset="100%" stop-color="#c1884f"/>
      </linearGradient></defs>
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#g-frame)"/>
      <rect x="17" y="17" width="66" height="66" rx="6" fill="#fff9ef"/>
      <path d="M50,68 C30,52 26,38 38,32 C46,28 50,36 50,38 C50,36 54,28 62,32 C74,38 70,52 50,68 Z" fill="#ff8fa3"/>
      <path d="M42,36 a5,5 0 0,1 6,3" stroke="#ffc4cf" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>` },
];

/* ---------- 房间背景 v2：暖光渐变 + 窗帘 + 光束 + 踢脚线 + 花纹地毯 ---------- */
export function roomBgSVG() {
  let dots = '';
  const dotPos = [[560, 120], [720, 260], [900, 100], [1080, 200], [620, 420], [1000, 400], [780, 490], [1140, 480], [470, 310], [1260, 150], [1360, 340], [300, 490]];
  for (const [x, y] of dotPos) dots += `<circle cx="${x}" cy="${y}" r="13" fill="#ffd6ab" opacity=".4"/>`;
  let planks = '';
  for (let y = 640; y < 1000; y += 88) planks += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#d69a63" stroke-width="3.5" opacity=".8"/>`;
  for (let i = 0; i < 14; i++) planks += `<line x1="${(i * 137 + (i % 2) * 60) % 1600}" y1="${556 + (i % 4) * 88 + 3}" x2="${(i * 137 + (i % 2) * 60) % 1600}" y2="${556 + (i % 4) * 88 + 84}" stroke="#d69a63" stroke-width="3.5" opacity=".8"/>`;
  let scallop = '';
  for (let a = 0; a < 360; a += 15) {
    const rx = 330 * Math.cos(a * Math.PI / 180), ry = 128 * Math.sin(a * Math.PI / 180);
    scallop += `<circle cx="${820 + rx}" cy="${800 + ry}" r="13" fill="#d5f0e4"/>`;
  }
  return `<svg id="room-bg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffeacc"/><stop offset="80%" stop-color="#ffddb8"/><stop offset="100%" stop-color="#f8d0a8"/>
      </linearGradient>
      <linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eec08c"/><stop offset="100%" stop-color="#d99f66"/>
      </linearGradient>
      <linearGradient id="g-beam" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff3c9" stop-opacity=".55"/><stop offset="100%" stop-color="#fff3c9" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="g-curtain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffc9a3"/><stop offset="100%" stop-color="#f5a978"/>
      </linearGradient>
      <radialGradient id="g-vig" cx="50%" cy="42%" r="75%">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="82%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#7a4020" stop-opacity=".18"/>
      </radialGradient>
      <linearGradient id="g-rug" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#cdeede"/><stop offset="100%" stop-color="#aeddc7"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="560" fill="url(#g-wall)"/>
    ${dots}
    <rect x="90" y="70" width="360" height="360" rx="26" fill="#fffdf8"/>
    <rect x="108" y="88" width="324" height="324" rx="16" fill="#b5e0f5"/>
    <rect x="108" y="88" width="324" height="160" rx="16" fill="#c8eafa"/>
    <circle cx="200" cy="170" r="42" fill="#ffe58e"/>
    <circle cx="200" cy="170" r="52" fill="#ffe58e" opacity=".35"/>
    <ellipse cx="330" cy="200" rx="58" ry="24" fill="#fff" opacity=".95"/>
    <ellipse cx="290" cy="212" rx="36" ry="18" fill="#fff" opacity=".9"/>
    <ellipse cx="180" cy="320" rx="46" ry="18" fill="#fff" opacity=".75"/>
    <line x1="270" y1="88" x2="270" y2="412" stroke="#fffdf8" stroke-width="14"/>
    <line x1="108" y1="250" x2="432" y2="250" stroke="#fffdf8" stroke-width="14"/>
    <path d="M70,60 Q86,58 96,74 L110,180 Q116,260 96,420 L70,430 Q94,250 82,140 Z" fill="url(#g-curtain)"/>
    <path d="M470,60 Q454,58 444,74 L430,180 Q424,260 444,420 L470,430 Q446,250 458,140 Z" fill="url(#g-curtain)"/>
    <path d="M70,56 L470,56 L470,80 Q270,100 70,80 Z" fill="#f5a978"/>
    <rect x="74" y="424" width="392" height="26" rx="13" fill="#f2c493"/>
    <path d="M120,440 L560,1000 L1060,1000 L420,440 Z" fill="url(#g-beam)"/>
    <rect x="1150" y="200" width="300" height="20" rx="10" fill="#d69a63"/>
    <rect x="1150" y="212" width="300" height="8" rx="4" fill="#c1884f"/>
    <rect x="1180" y="140" width="26" height="60" rx="5" fill="#f2a0a0"/>
    <rect x="1212" y="128" width="26" height="72" rx="5" fill="#8fc7e8"/>
    <rect x="1244" y="150" width="26" height="50" rx="5" fill="#a5d6a7"/>
    <circle cx="1330" cy="168" r="24" fill="#8fca8f"/>
    <circle cx="1318" cy="156" r="10" fill="#b0dfb0"/>
    <rect x="1316" y="184" width="28" height="18" rx="4" fill="#e08e5e"/>
    <rect x="1382" y="138" width="52" height="62" rx="8" fill="#fff9ef" stroke="#d69a63" stroke-width="6"/>
    <circle cx="1408" cy="164" r="14" fill="#f09f51"/>
    <path d="M1400,162 a8,8 0 1,1 16,0" fill="#fff4e3"/>
    <path d="M1445,300 Q1420,270 1445,240 Q1470,270 1445,300 Z" fill="#9ad39a"/>
    <path d="M1445,310 L1445,360" stroke="#5fa55f" stroke-width="6" stroke-linecap="round"/>
    <path d="M1415,368 L1475,368 L1467,420 Q1466,428 1456,428 L1434,428 Q1424,428 1423,420 Z" fill="#e08e5e"/>
    <rect y="540" width="1600" height="22" rx="4" fill="#f6cfa0"/>
    <rect y="556" width="1600" height="444" fill="url(#g-floor)"/>
    ${planks}
    <ellipse cx="820" cy="800" rx="352" ry="140" fill="#9fcfba"/>
    ${scallop}
    <ellipse cx="820" cy="800" rx="330" ry="128" fill="url(#g-rug)"/>
    <ellipse cx="820" cy="800" rx="250" ry="92" fill="none" stroke="#fff6ea" stroke-width="7" stroke-dasharray="1 24" stroke-linecap="round"/>
    <ellipse cx="820" cy="800" rx="170" ry="60" fill="none" stroke="#8fc7ae" stroke-width="5"/>
    <path d="M805,795 a9,9 0 1,1 9,9 M816,780 a7,7 0 1,1 14,4 M835,795 a9,9 0 1,0 -9,9" fill="none" stroke="#8fc7ae" stroke-width="0"/>
    <g fill="#8fc7ae"><circle cx="800" cy="790" r="7"/><circle cx="820" cy="782" r="7"/><circle cx="840" cy="790" r="7"/><ellipse cx="820" cy="808" rx="12" ry="9"/></g>
    <rect width="1600" height="1000" fill="url(#g-vig)"/>
  </svg>`;
}
