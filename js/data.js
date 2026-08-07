/* ============ 数据层：品种 / 家具 / 服饰 的 3D 参数 ============
   注意：id / name / price / slot / use 字段与 v0.4 保持一致，保证旧存档可用。 */

/* ---------------- 品种 ----------------
   coat  毛色；build 体型比例；ear/tail 造型；pattern 花纹（画到贴图上） */
export const BREEDS = {
  /* ===== 小狗 ===== */
  shiba: {
    kind: 'dog', label: '柴柴',
    coat: { base: '#e79a4e', shade: '#c97b33', belly: '#fff2df', earIn: '#c8794a', nose: '#33241c' },
    pattern: { type: 'shiba' },
    build: { len: 1.00, ht: 1.00, wd: 1.00, leg: 1.00, head: 1.00, muzzle: 0.92, neck: 1.0 },
    ear: 'point', tail: 'curl', fluff: 0.30,
    eye: { iris: '#4a2d1c', pupil: 'round' },
    collar: '#f25d7e',
  },
  corgi: {
    kind: 'dog', label: '小柯基',
    coat: { base: '#eda558', shade: '#cf8236', belly: '#fffaf1', earIn: '#dd8b5c', nose: '#2e211a' },
    pattern: { type: 'blaze' },
    build: { len: 1.18, ht: 0.92, wd: 1.05, leg: 0.62, head: 1.02, muzzle: 0.86, neck: 0.9 },
    ear: 'big', tail: 'nub', fluff: 0.34,
    eye: { iris: '#3f2a1b', pupil: 'round' },
    collar: '#5ba8de',
  },
  golden: {
    kind: 'dog', label: '小金毛',
    coat: { base: '#e8bd77', shade: '#c99b52', belly: '#fbf0d7', earIn: '#cfa15c', nose: '#2b2119' },
    pattern: { type: 'none' },
    build: { len: 1.08, ht: 1.06, wd: 1.02, leg: 1.12, head: 1.02, muzzle: 1.10, neck: 1.08 },
    ear: 'floppy', tail: 'feather', fluff: 0.42,
    eye: { iris: '#4b3120', pupil: 'round' },
    collar: '#7fc8a9',
  },
  bichon: {
    kind: 'dog', label: '云朵犬',
    coat: { base: '#fbf6ee', shade: '#e3d6c3', belly: '#ffffff', earIn: '#efdfca', nose: '#3a2c24' },
    pattern: { type: 'none' },
    build: { len: 0.94, ht: 1.00, wd: 1.06, leg: 0.92, head: 1.08, muzzle: 0.72, neck: 0.9 },
    ear: 'puff', tail: 'puff', fluff: 0.95,
    eye: { iris: '#3a2820', pupil: 'round' },
    collar: '#b28fd9',
  },
  /* ===== 小猫 ===== */
  calico: {
    kind: 'cat', label: '三花猫',
    coat: { base: '#fdf5e9', shade: '#e6d7c2', belly: '#ffffff', earIn: '#ffc0cb', nose: '#e79aa6' },
    pattern: { type: 'patches', colors: ['#e79a4e', '#4c3a2e'] },
    build: { len: 1.00, ht: 0.96, wd: 0.90, leg: 1.06, head: 0.94, muzzle: 0.62, neck: 0.92 },
    ear: 'cat', tail: 'cat', fluff: 0.30,
    eye: { iris: '#6fbf7a', pupil: 'slit' },
    collar: '#f25d7e',
  },
  orange: {
    kind: 'cat', label: '小橘猫',
    coat: { base: '#eda45f', shade: '#cf8440', belly: '#fff0dc', earIn: '#f0a0a8', nose: '#e08a8f' },
    pattern: { type: 'tabby', colors: ['#cd7f34'] },
    build: { len: 1.00, ht: 0.96, wd: 0.92, leg: 1.06, head: 0.94, muzzle: 0.62, neck: 0.92 },
    ear: 'cat', tail: 'cat', fluff: 0.28,
    eye: { iris: '#e0b24a', pupil: 'slit' },
    collar: '#7fc8a9',
  },
  gray: {
    kind: 'cat', label: '灰灰猫',
    coat: { base: '#b6c1cf', shade: '#93a1b2', belly: '#eef2f7', earIn: '#e8b6c0', nose: '#d99aa4' },
    pattern: { type: 'tabby', colors: ['#8794a6'] },
    build: { len: 1.00, ht: 0.96, wd: 0.90, leg: 1.06, head: 0.94, muzzle: 0.62, neck: 0.92 },
    ear: 'cat', tail: 'cat', fluff: 0.32,
    eye: { iris: '#8fd0c4', pupil: 'slit' },
    collar: '#ffd766',
  },
  tuxedo: {
    kind: 'cat', label: '奶牛猫',
    coat: { base: '#fbfbfb', shade: '#dedede', belly: '#ffffff', earIn: '#f2b3bd', nose: '#4a3c38' },
    pattern: { type: 'tuxedo', colors: ['#33302e'] },
    build: { len: 1.02, ht: 0.96, wd: 0.92, leg: 1.06, head: 0.94, muzzle: 0.62, neck: 0.92 },
    ear: 'cat', tail: 'cat', fluff: 0.30,
    eye: { iris: '#e2c25c', pupil: 'slit' },
    collar: '#8fb7ea',
  },
};

export const isCat = (b) => BREEDS[b] && BREEDS[b].kind === 'cat';

/* ---------------- 家具 ----------------
   kind: 3D 构建器名；r 碰撞半径；dyn=true 表示可被踢动的动态物体 */
export const FURNI = [
  { id: 'bed',     name: '温暖狗窝', price: 15, kind: 'bed',     use: 'sleep', r: 1.35, zone: 'floor' },
  { id: 'cushion', name: '软软坐垫', price: 10, kind: 'cushion', use: 'sit',   r: 0.95, zone: 'floor' },
  /* dyn 玩具：cy=模型中心离地高度（用来把原点挪到质心），hitR=被宠物撞到的判定半径 */
  { id: 'ball',    name: '彩色小球', price: 8,  kind: 'ball',    use: 'play',  r: 0.34, cy: 0.34, hitR: 0.40, zone: 'floor', dyn: true },
  { id: 'yarn',    name: '毛线球',   price: 8,  kind: 'yarn',    use: 'play',  r: 0.32, cy: 0.32, hitR: 0.38, zone: 'floor', dyn: true },
  { id: 'bone',    name: '骨头玩具', price: 10, kind: 'bone',    use: 'play',  r: 0.17, cy: 0.16, hitR: 0.42, zone: 'floor', dyn: true },
  { id: 'plant',   name: '小盆栽',   price: 12, kind: 'plant',   use: null,    r: 0.60, zone: 'floor' },
  { id: 'lamp',    name: '暖暖小灯', price: 20, kind: 'lamp',    use: null,    r: 0.55, zone: 'floor' },
  { id: 'frame',   name: '爱心画框', price: 15, kind: 'frame',   use: null,    r: 0.50, zone: 'wall' },
];

/* ---------------- 服饰 ----------------
   anchor: head / neck / face / back —— 挂在骨架对应插槽上 */
export const CLOTHES = [
  { id: 'bow',      name: '红蝴蝶结', price: 10, slot: 'head', icon: '🎀', kind: 'bow' },
  { id: 'strawhat', name: '小草帽',   price: 15, slot: 'head', icon: '👒', kind: 'strawhat' },
  { id: 'partyhat', name: '派对帽',   price: 15, slot: 'head', icon: '🥳', kind: 'partyhat' },
  { id: 'flower',   name: '小花环',   price: 18, slot: 'head', icon: '🌸', kind: 'flower' },
  { id: 'scarf',    name: '暖暖围巾', price: 15, slot: 'neck', icon: '🧣', kind: 'scarf' },
  { id: 'bowtie',   name: '绅士领结', price: 10, slot: 'neck', icon: '🤵', kind: 'bowtie' },
  { id: 'glasses',  name: '圆圆眼镜', price: 12, slot: 'face', icon: '🤓', kind: 'glasses' },
  { id: 'wings',    name: '天使翅膀', price: 25, slot: 'back', icon: '👼', kind: 'wings' },
];
