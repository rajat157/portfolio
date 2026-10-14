// Opt-in UI sound (D24): synthesized WebAudio clicks, off by default, never
// persisted. One shared module (home-prototype.html:1344-1362) so the stage,
// the contact form and nav/map hovers can all ask for tick()/thunk() without
// each owning an AudioContext — the AudioContext itself is created lazily, on
// the first enable, inside the user gesture that enables sound.
let ac: AudioContext | null = null;
let enabled = false;

function env(g: GainNode, t: number, peak: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function click(vol: number) {
  if (!enabled || !ac) return;
  const t = ac.currentTime;
  const n = Math.floor(ac.sampleRate * 0.03);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource();
  const hp = ac.createBiquadFilter();
  const g = ac.createGain();
  src.buffer = buf;
  hp.type = "highpass";
  hp.frequency.value = 1800;
  env(g, t, vol, 0.03);
  src.connect(hp).connect(g).connect(ac.destination);
  src.start(t);
}

export function tick(): void {
  click(0.05);
}

export function thunk(): void {
  if (!enabled || !ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.18);
  env(g, t, 0.45, 0.24);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.26);
  click(0.18);
}

export function setSoundOn(on: boolean): boolean {
  enabled = on;
  if (enabled && !ac) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new Ctor();
    } catch {
      enabled = false;
      return enabled;
    }
  }
  if (ac && ac.state === "suspended") ac.resume();
  if (enabled) click(0.12);
  return enabled;
}
