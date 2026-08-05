/* ============ 存档（localStorage） ============ */
const KEY = 'pet-home-ada-v1';

export const state = {
  hearts: 20,
  pet: null,                    // {breed, name}
  stats: { hunger: 80, clean: 80, energy: 90 },
  decor: {},                    // id -> {x, y}（占屏幕比例）
  wardrobe: { owned: {}, equipped: [] },
  hintsDone: {},
  last: Date.now(),
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    Object.assign(state, s);
    if (!state.wardrobe) state.wardrobe = { owned: {}, equipped: [] };
    // 离线衰减：温柔地降一点，但绝不让宠物太惨（下限 35）
    const mins = Math.min((Date.now() - (s.last || Date.now())) / 60000, 600);
    for (const k of ['hunger', 'clean']) {
      state.stats[k] = Math.max(35, state.stats[k] - mins * 0.08);
    }
    state.stats.energy = Math.min(100, state.stats.energy + mins * 0.5); // 离线=休息
    return !!state.pet;
  } catch (e) { return false; }
}

let saveTimer = null;
export function save() {
  state.last = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }, 300);
}
