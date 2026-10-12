// Small shared helpers: seeded random numbers, storage, formatting and chiptune sound effects.
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});

  // mulberry32: a tiny seeded PRNG, so the same seed always gives the same deal.
  S.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  S.shuffle = function (arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  S.pick = (arr, n, rnd) => S.shuffle(arr.slice(), rnd).slice(0, n);
  S.randInt = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  S.newSeed = () => Math.floor(Math.random() * 2147483647);

  S.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  S.fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  };

  S.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* storage full or blocked */ }
    },
    del(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) { /* ignore */ }
    },
  };

  // Square-wave blips made with the Web Audio API, so there are no audio files to load.
  S.sound = (function () {
    let ctx = null;
    let enabled = true;

    function tone(freq, dur, opts = {}) {
      const t0 = ctx.currentTime + (opts.at || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
      gain.gain.setValueAtTime(opts.vol || 0.05, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
    const notes = (list, step, opts = {}) => list.forEach((f, i) => tone(f, step * 1.6, { ...opts, at: i * step }));

    const fx = {
      pick: () => tone(700, 0.04, { vol: 0.025 }),
      place: () => tone(330, 0.07, { to: 210, vol: 0.05 }),
      flip: () => tone(950, 0.04, { type: 'triangle', vol: 0.07 }),
      draw: () => tone(480, 0.05, { to: 640, vol: 0.03 }),
      shuffle: () => notes([300, 380, 300, 380, 300], 0.035, { vol: 0.025 }),
      found: () => notes([660, 990], 0.06, { vol: 0.04 }),
      bad: () => tone(150, 0.14, { type: 'sawtooth', vol: 0.035 }),
      hint: () => notes([880, 1175], 0.05, { type: 'triangle', vol: 0.06 }),
      complete: () => notes([523, 659, 784, 1047], 0.07, { vol: 0.045 }),
      win: () => notes([523, 659, 784, 1047, 784, 1047, 1319, 1568], 0.1, { vol: 0.05 }),
      lose: () => notes([392, 330, 262, 196], 0.15, { type: 'triangle', vol: 0.07 }),
    };

    return {
      get on() {
        return enabled;
      },
      set on(v) {
        enabled = !!v;
      },
      play(name) {
        if (!enabled || !fx[name]) return;
        try {
          if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
          if (ctx.state === 'suspended') ctx.resume();
          fx[name]();
        } catch (e) { /* audio not available */ }
      },
    };
  })();
})();
