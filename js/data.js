/* ============ 数据层：品种 / 家具 / 服饰 ============
   id / name / price / slot / use 字段跨版本保持一致，保证旧存档可用。 */

/* ---------------- 品种 ----------------
   coat  毛色；build 体型比例；ear/tail 造型；pattern 花纹（画到贴图上） */
/* anchor：服饰挂点，全部是【相对该品种贴纸包围盒】的比例。
   每个品种头的位置都不一样（贴图里有的头在左、有的在右），
   写一套通用坐标一定会让帽子飘在半空 —— 这些数是把贴纸打上
   10% 网格后逐只读出来的。
     head 头顶中心（帽子/花环/蝴蝶结）
     face 眼睛高度（眼镜）
     neck 脖子胸口（围巾/领结）
     hw   头宽，服饰按它缩放 */
export const BREEDS = {
  shiba:  { kind: 'dog', label: '柴柴',   anchor: { hx: 0.22, hy: 0.05, fy: 0.275, ny: 0.43, hw: 0.3 } },
  corgi:  { kind: 'dog', label: '小柯基', anchor: { hx: 0.6, hy: 0.04, fy: 0.285, ny: 0.45, hw: 0.28 } },
  golden: { kind: 'dog', label: '小金毛', anchor: { hx: 0.32, hy: 0.07, fy: 0.305, ny: 0.47, hw: 0.28 } },
  bichon: { kind: 'dog', label: '云朵犬', anchor: { hx: 0.27, hy: 0.09, fy: 0.335, ny: 0.51, hw: 0.3 } },
  calico: { kind: 'cat', label: '三花猫', anchor: { hx: 0.2, hy: 0.13, fy: 0.375, ny: 0.55, hw: 0.26 } },
  orange: { kind: 'cat', label: '小橘猫', anchor: { hx: 0.3, hy: 0.13, fy: 0.375, ny: 0.55, hw: 0.26 } },
  gray:   { kind: 'cat', label: '灰灰猫', anchor: { hx: 0.35, hy: 0.15, fy: 0.395, ny: 0.57, hw: 0.28 } },
  tuxedo: { kind: 'cat', label: '奶牛猫', anchor: { hx: 0.42, hy: 0.05, fy: 0.315, ny: 0.51, hw: 0.26 } },
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
/* k  = 宽度相对宠物头宽的倍数
   dx = 水平微调（相对头宽）
   dy = 垂直微调（相对头宽，正=往下）
   rot= 旋转角 */
export const CLOTHES = [
  { id: 'bow',      name: '红蝴蝶结', price: 10, slot: 'head', icon: '🎀', k: 0.62, dx: 0.34, dy: 0.16, rot: -14 },
  { id: 'strawhat', name: '小草帽',   price: 15, slot: 'head', icon: '👒', k: 1.28, dx: 0, dy: 0.16 },
  { id: 'partyhat', name: '派对帽',   price: 15, slot: 'head', icon: '🥳', k: 0.78, dx: 0.16, dy: -0.06, rot: 12 },
  { id: 'flower',   name: '小花环',   price: 18, slot: 'head', icon: '🌸', k: 1.18, dx: 0, dy: 0.24 },
  { id: 'scarf',    name: '暖暖围巾', price: 15, slot: 'neck', icon: '🧣', k: 1.15, dx: 0, dy: 0.1 },
  { id: 'bowtie',   name: '绅士领结', price: 10, slot: 'neck', icon: '🤵', k: 0.62, dx: 0, dy: 0.06 },
  { id: 'glasses',  name: '圆圆眼镜', price: 12, slot: 'face', icon: '🤓', k: 1.0, dx: 0, dy: 0 },
  { id: 'wings',    name: '天使翅膀', price: 25, slot: 'back', icon: '👼', k: 1.9, dx: 0, dy: 0.9, behind: true },
];
