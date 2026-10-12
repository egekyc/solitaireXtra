// Canvas effects: pixel particle bursts and the classic bouncing-card win cascade.
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});
  const PX = S.PX;

  let trail; // cascade canvas (never cleared while running, so cards leave trails)
  let spark; // particle canvas (cleared every frame)
  let particles = [];
  let sparkRaf = 0;
  let cascade = null;

  function fit(cv) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr);
    cv.height = Math.round(innerHeight * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  function init() {
    trail = document.getElementById('fx-trail');
    spark = document.getElementById('fx-spark');
  }

  // ---- Particle burst ----
  function burst(x, y, colors, count = 28) {
    if (!spark) init();
    if (!sparkRaf) fit(spark);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 3,
        s: 3 + Math.floor(Math.random() * 3) * 2,
        c: colors[i % colors.length],
        life: 40 + Math.random() * 30,
      });
    }
    if (!sparkRaf) sparkRaf = requestAnimationFrame(tickSpark);
  }

  function tickSpark() {
    const ctx = spark.getContext('2d');
    ctx.clearRect(0, 0, spark.width, spark.height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.vx *= 0.98;
      p.life--;
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    ctx.globalAlpha = 1;
    sparkRaf = particles.length ? requestAnimationFrame(tickSpark) : 0;
    if (!sparkRaf) ctx.clearRect(0, 0, spark.width, spark.height);
  }

  // ---- Card images for the cascade ----
  function cardImage(info, w, h) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // Pixel card: dark edge with notched corners, then the face colour.
    ctx.fillStyle = '#1a1626';
    ctx.fillRect(2, 0, w - 4, h);
    ctx.fillRect(0, 2, w, h - 4);
    ctx.fillStyle = info.bg;
    ctx.fillRect(4, 2, w - 8, h - 4);
    ctx.fillRect(2, 4, w - 4, h - 8);
    ctx.fillStyle = info.fg;
    ctx.textBaseline = 'top';
    if (info.textFont === 'px') {
      ctx.font = `${Math.round(w * 0.2)}px "Press Start 2P", monospace`;
      ctx.fillText(info.text, Math.round(w * 0.08), Math.round(w * 0.08));
    } else {
      let size = Math.round(w * 0.17);
      ctx.font = `700 ${size}px "Pixelify Sans", sans-serif`;
      const words = info.text.split(' ');
      const lines = [];
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > w - 10 && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      lines.push(line);
      ctx.textAlign = 'center';
      lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, w / 2, Math.round(w * 0.08) + i * size * 1.05, w - 8));
    }
    if (info.sprite) {
      const gw = Math.max(...info.sprite.map((r) => r.length));
      const scale = Math.max(1, Math.floor((w * 0.55) / gw));
      const sx = Math.round((w - gw * scale) / 2);
      const sy = Math.round(h * 0.62 - (info.sprite.length * scale) / 2);
      PX.paint(ctx, info.sprite, info.spriteColors, sx, sy, scale);
    }
    return cv;
  }

  // cards: [{ info, x, y, w, h }] in page coordinates. Calls done() when finished or tapped.
  function runCascade(cards, done) {
    if (!trail) init();
    stopCascade();
    const ctx = fit(trail);
    trail.classList.add('on');
    const W = innerWidth;
    const H = innerHeight;
    const imgs = new Map();
    let next = 0;
    const active = [];
    let frame = 0;
    const finish = () => {
      if (!cascade) return;
      stopCascade();
      done && done();
    };
    trail.onclick = finish;
    cascade = { raf: 0, finish };

    function launch() {
      const c = cards[next++ % cards.length];
      if (!imgs.has(c)) imgs.set(c, cardImage(c.info, Math.round(c.w), Math.round(c.h)));
      const dir = Math.random() < 0.5 ? -1 : 1;
      active.push({ img: imgs.get(c), x: c.x, y: c.y, w: c.w, h: c.h, vx: dir * (2 + Math.random() * 4), vy: -Math.random() * 8 });
    }

    function tick() {
      frame++;
      if (frame % 14 === 1 && next < Math.max(cards.length, 26)) launch();
      for (let i = active.length - 1; i >= 0; i--) {
        const a = active[i];
        a.vy += 0.6;
        a.x += a.vx;
        a.y += a.vy;
        if (a.y + a.h > H) {
          a.y = H - a.h;
          a.vy = -a.vy * 0.78;
        }
        ctx.drawImage(a.img, Math.round(a.x), Math.round(a.y));
        if (a.x > W + 10 || a.x + a.w < -10) active.splice(i, 1);
      }
      if (frame > 60 * 7 || (next >= Math.max(cards.length, 26) && !active.length)) return finish();
      cascade.raf = requestAnimationFrame(tick);
    }
    cascade.raf = requestAnimationFrame(tick);
  }

  function stopCascade() {
    if (!cascade) return;
    cancelAnimationFrame(cascade.raf);
    cascade = null;
    trail.onclick = null;
    trail.classList.remove('on');
    setTimeout(() => {
      if (!cascade) trail.getContext('2d').clearRect(0, 0, trail.width, trail.height);
    }, 400);
  }

  S.FX = { burst, runCascade, stopCascade };
})();
