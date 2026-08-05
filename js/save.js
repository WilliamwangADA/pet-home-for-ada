/* ============ 存档（localStorage） ============ */
const KEY = 'pet-home-ada-v1';

export const state = {
  hearts: 20,
  pets: [],                     // [{breed, name, equipped:[]}]，第一只是初始领养
  active: 0,                    // 当前选中的宠物下标
  stats: { hunger: 80, clean: 80, energy: 90 },
  decor: {},                    // id -> {x, y}（占屏幕比例）
  wardrobe: { owned: {} },      // 衣服全家共享，穿在谁身上记在 pets[i].equipped
  hintsDone: {},
  last: Date.now(),
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    Object.assign(state, s);

    // --- 旧存档迁移：单宠物 state.pet → state.pets[] ---
    if (!Array.isArray(state.pets)) state.pets = [];
    if (s.pet && !state.pets.length) {
      state.pets = [{ breed: s.pet.breed, name: s.pet.name, equipped: [] }];
    }
    if (!state.wardrobe || !state.wardrobe.owned) state.wardrobe = { owned: {} };
    // v0.2 的 wardrobe.equipped 是全局的，迁到第一只身上
    if (s.wardrobe && Array.isArray(s.wardrobe.equipped) && state.pets[0] && !state.pets[0].equipped.length) {
      state.pets[0].equipped = s.wardrobe.equipped.slice();
    }
    for (const p of state.pets) if (!Array.isArray(p.equipped)) p.equipped = [];
    delete state.pet;
    state.active = Math.min(state.active || 0, Math.max(0, state.pets.length - 1));

    // 离线衰减：温柔地降一点，但绝不让宠物太惨（下限 35）
    const mins = Math.min((Date.now() - (s.last || Date.now())) / 60000, 600);
    for (const k of ['hunger', 'clean']) {
      state.stats[k] = Math.max(35, state.stats[k] - mins * 0.08);
    }
    state.stats.energy = Math.min(100, state.stats.energy + mins * 0.5); // 离线=休息
    return state.pets.length > 0;
  } catch (e) { return false; }
}

export const activePet = () => state.pets[state.active] || state.pets[0];

let saveTimer = null;
export function save() {
  state.last = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }, 300);
}
