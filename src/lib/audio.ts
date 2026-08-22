// A tiny music-box engine. If a song has a real audio file we play that;
// otherwise the room hums a gentle, seeded melody so something is always heard.

export function isAudioFile(url: string) {
  return /\.(mp3|m4a|ogg|oga|wav|flac|aac|webm)(\?|#|$)/i.test(url.trim());
}

function seedFrom(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const PENTATONIC = [0, 2, 4, 7, 9];

export class MusicBox {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private rand: () => number = rng(1);
  private root = 220;

  private vol = 0.22;

  setVolume(v: number) {
    this.vol = v;
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(Math.max(0.0001, v), ctx.currentTime + 0.25);
    } catch {
      /* ignore */
    }
  }

  start(seedKey: string, volume = 0.22) {
    this.vol = volume;
    this.stop();
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(Math.max(0.0001, this.vol), ctx.currentTime + 1.4);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;

    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;

    master.connect(lp);
    lp.connect(ctx.destination);
    lp.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);
    this.master = master;

    const seed = seedFrom(seedKey);
    this.rand = rng(seed);
    this.root = 174.6 * Math.pow(2, ((seed % 5) - 2) / 12);
    this.step = 0;

    const tick = () => {
      this.note();
      this.timer = window.setTimeout(tick, 520 + Math.floor(this.rand() * 240));
    };
    tick();
  }

  private note() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const r = this.rand();
    if (r < 0.14) {
      this.step++;
      return;
    }
    const octave = r < 0.45 ? 1 : r < 0.85 ? 2 : 4;
    const degree = PENTATONIC[Math.floor(this.rand() * PENTATONIC.length)] ?? 0;
    const freq = this.root * octave * Math.pow(2, degree / 12);

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = this.step % 4 === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 2.4);

    // occasional low warm root underneath
    if (this.step % 8 === 0) {
      const bass = ctx.createOscillator();
      bass.type = "sine";
      bass.frequency.value = this.root / 2;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.18, t + 0.4);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      bass.connect(bg);
      bg.connect(master);
      bass.start(t);
      bass.stop(t + 4.2);
    }
    this.step++;
  }

  stop() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      } catch {
        /* ignore */
      }
      const c = ctx;
      window.setTimeout(() => void c.close().catch(() => {}), 900);
    }
    this.ctx = null;
    this.master = null;
  }
}

// ————————————————————————————————————————————————
// Rain on the window: the real recording, looped, through a shared master gain.
export class RainAmbience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private el: HTMLAudioElement | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  private gustTimer: number | null = null;

  setVolume(v: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(Math.max(0.0001, v), ctx.currentTime + 0.4);
    } catch {
      /* ignore */
    }
  }

  start(volume = 0.13, url?: string) {
    this.stop();
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(Math.max(0.0001, volume), ctx.currentTime + 2);

    // A real rain recording, looped and routed through the same master gain.
    if (url) {
      const el = new Audio(url);
      el.loop = true;
      el.preload = "auto";
      el.id = "rain-source";
      document.body.appendChild(el);
      const src = ctx.createMediaElementSource(el);
      src.connect(master);
      master.connect(ctx.destination);
      el.volume = 0.9;
      void el.play().catch(() => {});
      this.el = el;
      this.master = master;
      return;
    }

    // Fallback: 3 seconds of pink-ish noise, looped
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099;
      b1 = 0.963 * b1 + w * 0.2965;
      b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 420;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;

    src.connect(hp);
    hp.connect(lp);
    lp.connect(master);
    master.connect(ctx.destination);
    src.start();

    this.nodes = [src];
    this.master = master;

    // slow gusts against the glass
    const gust = () => {
      if (!this.ctx || !this.master) return;
      const t = this.ctx.currentTime;
      lp.frequency.cancelScheduledValues(t);
      lp.frequency.setValueAtTime(lp.frequency.value, t);
      lp.frequency.linearRampToValueAtTime(3600 + Math.random() * 4200, t + 3 + Math.random() * 3);
      this.gustTimer = window.setTimeout(gust, 5000 + Math.random() * 7000);
    };
    this.gustTimer = window.setTimeout(gust, 4000);
  }

  stop() {
    if (this.gustTimer !== null) {
      window.clearTimeout(this.gustTimer);
      this.gustTimer = null;
    }
    if (this.el) {
      try {
        this.el.pause();
        this.el.src = "";
      } catch {
        /* ignore */
      }
      this.el = null;
    }
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1);
      } catch {
        /* ignore */
      }
      this.nodes.forEach((n) => {
        try {
          n.stop(ctx.currentTime + 1.2);
        } catch {
          /* ignore */
        }
      });
      const c = ctx;
      window.setTimeout(() => void c.close().catch(() => {}), 1500);
    }
    this.nodes = [];
    this.ctx = null;
    this.master = null;
  }
}

// ————————————————————————————————————————————————
// The mantel clock: a soft wooden tick every second.

// ————————————————————————————————————————————————
// The mantel clock: a soft wooden tick every second.
export class ClockTick {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private tock = false;

  setVolume(v: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(Math.max(0.0001, v), ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  }

  private tick() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;

    // short filtered noise burst = wooden click
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 12);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = this.tock ? 1500 : 2100;
    bp.Q.value = 3.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(this.tock ? 0.75 : 1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + 0.12);

    this.tock = !this.tock;
  }

  start(volume = 0.18) {
    this.stop();
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(Math.max(0.0001, volume), ctx.currentTime + 1.2);
    master.connect(ctx.destination);
    this.master = master;

    this.tick();
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      } catch {
        /* ignore */
      }
      const c = ctx;
      window.setTimeout(() => void c.close().catch(() => {}), 800);
    }
    this.ctx = null;
    this.master = null;
  }
}
