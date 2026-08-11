/* ============ 数据层：品种 / 家具 / 服饰 ============
   id / name / price / slot / use 字段跨版本保持一致，保证旧存档可用。 */

/* ---------------- 品种 ----------------
   coat  毛色；build 体型比例；ear/tail 造型；pattern 花纹（画到贴图上） */
export const BREEDS = {
  shiba:  { kind: 'dog', label: '柴柴' },
  corgi:  { kind: 'dog', label: '小柯基' },
  golden: { kind: 'dog', label: '小金毛' },
  bichon: { kind: 'dog', label: '云朵犬' },
  calico: { kind: 'cat', label: '三花猫' },
  orange: { kind: 'cat', label: '小橘猫' },
  gray:   { kind: 'cat', label: '灰灰猫' },
  tuxedo: { kind: 'cat', label: '奶牛猫' },
};

export const isCat = (b) => BREEDS[b] && BREEDS[b].kind === 'cat';

/* ---------------- 家具 ----------------
   w = 贴纸宽度（vmin）；id/name/price/use/zone 与旧版一致，旧存档直接可用 */
/* r    = 地面碰撞半径（u 单位，屏幕宽度的比例）
   dyn  = 可被踢飞/滚动的玩具
   soft = 软的，宠物可以走上去（狗窝、坐垫）不当障碍
   rest/fric = 弹性 / 摩擦，决定手感：球会弹会滚，骨头几乎不弹 */
export const FURNI = [
  { id: 'bed',     name: '温暖狗窝', price: 15, w: 30, use: 'sleep', zone: 'floor', r: 0.115, soft: true },
  { id: 'cushion', name: '软软坐垫', price: 10, w: 22, use: 'sit',   zone: 'floor', r: 0.085, soft: true },
  { id: 'ball',    name: '彩色小球', price: 8,  w: 10, use: 'play',  zone: 'floor', r: 0.030, dyn: true, rest: 0.60, fric: 1.6, spin: 1 },
  { id: 'yarn',    name: '毛线球',   price: 8,  w: 11, use: 'play',  zone: 'floor', r: 0.032, dyn: true, rest: 0.42, fric: 2.4, spin: 1 },
  { id: 'bone',    name: '骨头玩具', price: 10, w: 13, use: 'play',  zone: 'floor', r: 0.034, dyn: true, rest: 0.28, fric: 3.4, spin: 0.35 },
  { id: 'plant',   name: '小盆栽',   price: 12, w: 18, use: null,    zone: 'floor', r: 0.062 },
  { id: 'lamp',    name: '暖暖小灯', price: 20, w: 17, use: null,    zone: 'floor', r: 0.052 },
  { id: 'frame',   name: '爱心画框', price: 15, w: 15, use: null,    zone: 'wall' },
];

/* ---------------- 服饰 ----------------
   slot 同槽位互斥；贴图 assets/art/clothes/<id>.png */
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
