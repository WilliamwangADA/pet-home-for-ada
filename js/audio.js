/* ============ 音频：WebAudio 合成音效 + 预生成配音 ============ */
let ctx = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.25, when = 0, slide = 0) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  const t = c.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, freq, vol = 0.2, when = 0) {
  const c = ac(), len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
  const g = c.createGain();
  const t = c.currentTime + when;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

export const sfx = {
  unlock() { ac(); },                       // 首次手势时解锁 iOS 音频
  pip()    { tone(620, 0.08, 'sine', 0.18); },
  pop()    { tone(420, 0.1, 'sine', 0.3, 0, 500); },
  ding()   { tone(880, 0.35, 'triangle', 0.22); tone(1320, 0.4, 'sine', 0.1, 0.05); },
  sparkle(){ [1180, 1480, 1760].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.08)); },
  coin()   { tone(988, 0.1, 'square', 0.08); tone(1319, 0.3, 'square', 0.08, 0.09); },
  munch()  { [0, 0.16, 0.32].forEach(w => noise(0.09, 320, 0.3, w)); },
  splash() { noise(0.4, 700, 0.25); tone(300, 0.3, 'sine', 0.1, 0, -150); },
  bubble() { tone(300 + Math.random() * 250, 0.12, 'sine', 0.12, 0, 300); },
  chime()  { [523, 659, 784].forEach((f, i) => tone(f, 0.6, 'sine', 0.12, i * 0.18)); },
  boing()  { tone(180, 0.25, 'sine', 0.25, 0, 240); },
  purr()   { for (let i = 0; i < 6; i++) tone(70 + (i % 2) * 12, 0.09, 'triangle', 0.1, i * 0.085); },
  night()  { [784, 659, 523, 392].forEach((f, i) => tone(f, 0.7, 'sine', 0.1, i * 0.3)); },
  brush()  { noise(0.14, 1800, 0.08); },
};

/* ---------- 配音（edge-tts 预生成 MP3，懒加载） ---------- */
const voiceEl = new Audio();     // 精灵旁白独占一条通道
const petEl = new Audio();       // 宠物叫声独立通道，可与旁白叠
const cache = {};

function playOn(el, name) {
  const url = `assets/audio/${name}.mp3`;
  if (cache[name] === false) return;      // 已知加载失败就静默
  el.src = url;
  el.play().catch(() => { cache[name] = false; });
}

export function voice(name) { playOn(voiceEl, name); }
export function petVoice(name) { playOn(petEl, name); }
export function stopVoice() { voiceEl.pause(); }
