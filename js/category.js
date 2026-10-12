// Category solitaire, used by "Countries" (kind 'geo'), "Games" (kind 'games') and "TV & Movies" (kind 'screen').
//
// Each set has one CATEGORY card (e.g. "Europe") and several WORD cards (e.g. "France").
// - A category card goes on an empty slot at the top; matching words are then added on top of it.
// - When a slot holds its category and all of its words, the set clears and the slot is free again.
// - In the columns, a word can go on a face-up word or category card of the same set.
// - Any card, or a run of one set, can go into an empty column.
// - Tapping the stock turns over one card. Every move and draw uses up one move.
//
// Every deal is checked by the solver below before it is dealt, so it can always be won.
// The move budget comes from the solver's solution length plus some slack.
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});
  const PX = S.PX;

  const SLOTS = 4;
  const DIFF = {
    easy: { cats: 4, items: [4, 5], heights: [2, 3, 4, 5], slack: 1.9, extra: 15 },
    normal: { cats: 5, items: [5, 6], heights: [2, 3, 4, 5, 6], slack: 1.6, extra: 15 },
    hard: { cats: 6, items: [6, 7], heights: [3, 4, 5, 6, 7], slack: 1.45, extra: 15 },
  };
  const PALETTE = ['#d6453d', '#3f6fd8', '#d9a21b', '#3fa65a', '#9b59d0', '#e0702e', '#22a3a3', '#d24f9a'];

  const top = (pile) => pile[pile.length - 1];
  const FOUND = (g) => Array.from({ length: g.F }, (_, i) => 'f' + i);
  const TAB = (g) => Array.from({ length: g.T }, (_, i) => 't' + i);

  // ---------- Dealing ----------

  function pickCategories(opts, rnd) {
    const d = DIFF[opts.diff];
    if (opts.kind === 'geo') {
      return S.pick(S.GEO, d.cats, rnd).map((c) => {
        const pool =
          opts.diff === 'easy' ? c.countries.slice(0, c.easy)
            : opts.diff === 'normal' ? c.countries.slice(0, Math.round(c.easy * 1.6))
              : c.countries;
        const n = Math.min(pool.length, S.randInt(rnd, d.items[0], d.items[1]));
        return { name: c.name, color: c.color, icon: 'globe', items: S.pick(pool, n, rnd) };
      });
    }
    // 'games' uses video games only; 'screen' uses TV shows and/or movies.
    const pool = S.FANDOM.filter((f) =>
      opts.kind === 'games' ? f.medium === 'game' : f.medium !== 'game' && (opts.pack === 'mix' || f.medium === opts.pack)
    );
    const colors = S.shuffle(PALETTE.slice(), rnd);
    return S.pick(pool, d.cats, rnd).map((f, i) => ({
      name: f.name,
      color: colors[i % colors.length],
      icon: f.medium,
      items: S.pick(f.chars, S.randInt(rnd, d.items[0], d.items[1]), rnd),
    }));
  }

  function deal(opts, seed) {
    const rnd = S.rng(seed);
    const d = DIFF[opts.diff];
    const cats = pickCategories(opts, rnd);
    const deck = [];
    cats.forEach((c, k) => {
      deck.push({ id: deck.length, kind: 'cat', cat: k, label: c.name });
      c.items.forEach((name) => deck.push({ id: deck.length, kind: 'item', cat: k, label: name }));
    });
    const order = S.shuffle(deck.map((c) => c.id), rnd);
    const p = { stock: [], waste: [], done: [] };
    for (let i = 0; i < SLOTS; i++) p['f' + i] = [];
    let k = 0;
    d.heights.forEach((h, i) => {
      p['t' + i] = [];
      for (let j = 0; j < h; j++) p['t' + i].push({ id: order[k++], up: j === h - 1 });
    });
    while (k < order.length) p.stock.push({ id: order[k++], up: false });
    return {
      mode: opts.kind,
      opts: { kind: opts.kind, diff: opts.diff, pack: opts.pack || 'mix' },
      seed,
      deck,
      cats: cats.map((c) => ({ name: c.name, color: c.color, icon: c.icon, size: c.items.length })),
      F: SLOTS,
      T: d.heights.length,
      p,
      n: { moves: 0, time: 0, budget: 0, par: 0, sets: 0 },
    };
  }

  function newGame(opts, seed) {
    const d = DIFF[opts.diff] || DIFF.normal;
    opts = { ...opts, diff: DIFF[opts.diff] ? opts.diff : 'normal' };
    let g = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      g = deal(opts, (seed + attempt * 7919) >>> 0);
      const sol = solve(g, 8000);
      if (sol) {
        g.n.par = sol.length;
        g.n.budget = Math.ceil((sol.length * d.slack + d.extra) / 5) * 5;
        return g;
      }
    }
    // Practically never happens; fall back to a generous budget.
    g.n.budget = g.deck.length * 4;
    return g;
  }

  // ---------- Rules ----------

  const piles = (g) => ['stock', 'waste', ...FOUND(g), ...TAB(g), 'done'];

  // Face-up cards from i to the top, all from one set, with a category card only at the bottom.
  function isRun(g, cards, i) {
    if (!cards[i] || !cards[i].up) return false;
    for (let j = i + 1; j < cards.length; j++) {
      const a = g.deck[cards[j - 1].id];
      const b = g.deck[cards[j].id];
      if (!cards[j].up || b.kind === 'cat' || a.cat !== b.cat) return false;
    }
    return true;
  }

  function canPickUp(g, pile, i) {
    const cards = g.p[pile];
    if (!cards || i < 0 || i >= cards.length) return false;
    if (pile === 'waste') return i === cards.length - 1;
    if (pile[0] === 't') return isRun(g, cards, i);
    return false;
  }

  function canDrop(g, from, i, to) {
    if (from === to || !canPickUp(g, from, i)) return false;
    const base = g.deck[g.p[from][i].id];
    const dest = g.p[to];
    if (!dest) return false;
    if (to[0] === 'f') {
      if (!dest.length) return base.kind === 'cat';
      return base.kind === 'item' && base.cat === g.deck[dest[0].id].cat;
    }
    if (to[0] === 't') {
      if (!dest.length) return true;
      const t = top(dest);
      return t.up && base.kind === 'item' && g.deck[t.id].cat === base.cat;
    }
    return false;
  }

  function applyMove(g, from, i, to) {
    const moving = g.p[from].splice(i);
    moving.forEach((c) => (c.up = true));
    g.p[to].push(...moving);
    const ev = ['move'];
    const rest = g.p[from];
    if (from[0] === 't' && rest.length && !top(rest).up) {
      top(rest).up = true;
      ev.push('flip');
    }
    if (to[0] === 'f') {
      ev.push('found');
      const f = g.p[to];
      const cat = g.deck[f[0].id].cat;
      if (f.length === g.cats[cat].size + 1) {
        g.p.done.push(...f.splice(0).map((c) => ({ id: c.id, up: true, at: to })));
        g.n.sets++;
        g.n.lastSet = { pile: to, cat };
        ev.push('complete');
      }
    }
    g.n.moves++;
    if (isWon(g)) ev.push('win');
    return ev;
  }

  function draw(g) {
    const { stock, waste } = g.p;
    if (stock.length) {
      const c = stock.pop();
      c.up = true;
      waste.push(c);
      g.n.moves++;
      return ['draw'];
    }
    if (waste.length > 1) {
      g.p.stock = waste.reverse().map((c) => ({ id: c.id, up: false }));
      g.p.waste = [];
      g.n.moves++;
      return ['recycle'];
    }
    return null;
  }

  const isWon = (g) => g.n.sets === g.cats.length;
  const movesLeft = (g) => g.n.budget - g.n.moves;
  const isLost = (g) => !isWon(g) && movesLeft(g) <= 0;

  function autoTarget(g, from, i) {
    if (!canPickUp(g, from, i)) return null;
    for (const f of FOUND(g)) if (canDrop(g, from, i, f)) return f;
    const tabs = TAB(g).filter((t) => t !== from);
    for (const t of tabs) if (g.p[t].length && canDrop(g, from, i, t)) return t;
    if (from === 'waste' || i > 0) for (const t of tabs) if (!g.p[t].length) return t;
    return null;
  }

  // Hints come from the solver, so they are real steps toward a win.
  function hint(g) {
    const sol = solve(g, 20000);
    if (!sol) return null;
    if (!sol.length) return null;
    return { ...sol[0], total: sol.length };
  }

  // ---------- Solver ----------
  // Weighted best-first search over a compact copy of the game. Tableau cards are ints:
  // id for face-up, -(id + 1) for face-down. Columns and slots are sorted in the state key,
  // because their order does not matter for solvability.

  function Heap() {
    const a = [];
    return {
      get size() {
        return a.length;
      },
      push(n) {
        a.push(n);
        let i = a.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (a[p].f <= a[i].f) break;
          [a[p], a[i]] = [a[i], a[p]];
          i = p;
        }
      },
      pop() {
        const r = a[0];
        const last = a.pop();
        if (a.length) {
          a[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1;
            const rr = l + 1;
            let m = i;
            if (l < a.length && a[l].f < a[m].f) m = l;
            if (rr < a.length && a[rr].f < a[m].f) m = rr;
            if (m === i) break;
            [a[m], a[i]] = [a[i], a[m]];
            i = m;
          }
        }
        return r;
      },
    };
  }

  function solve(g, maxNodes) {
    const nCards = g.deck.length;
    const isCat = new Uint8Array(nCards);
    const catOf = new Int16Array(nCards);
    g.deck.forEach((c) => {
      isCat[c.id] = c.kind === 'cat' ? 1 : 0;
      catOf[c.id] = c.cat;
    });
    const size = g.cats.map((c) => c.size);
    const T = g.T;
    const F = g.F;
    const ncat = g.cats.length;
    const WEIGHT = 2;

    const root = { tab: [], stock: g.p.stock.map((c) => c.id), waste: g.p.waste.map((c) => c.id), fc: [], fn: [], done: g.n.sets, g: 0, parent: null, move: null };
    for (let i = 0; i < T; i++) root.tab.push(g.p['t' + i].map((c) => (c.up ? c.id : -(c.id + 1))));
    for (let i = 0; i < F; i++) {
      const f = g.p['f' + i];
      root.fc.push(f.length ? catOf[f[0].id] : -1);
      root.fn.push(f.length ? f.length - 1 : 0);
    }

    const clone = (s) => ({ tab: s.tab.map((c) => c.slice()), stock: s.stock.slice(), waste: s.waste.slice(), fc: s.fc.slice(), fn: s.fn.slice(), done: s.done, g: s.g + 1, parent: s, move: null });
    const key = (s) =>
      s.tab.map((c) => c.join(',')).sort().join('|') + '/' + s.stock.join(',') + '/' + s.waste.join(',') + '/' +
      s.fc.map((c, i) => (c < 0 ? '' : c + ':' + s.fn[i])).sort().join(',');
    function h(s) {
      let n = s.stock.length + s.waste.length;
      for (const col of s.tab) for (const v of col) n += v < 0 ? 2 : 1;
      return n;
    }
    function flipTop(col) {
      const l = col.length - 1;
      if (l >= 0 && col[l] < 0) col[l] = -col[l] - 1;
    }
    function toFound(s, cards, k) {
      for (const id of cards) {
        if (isCat[id]) s.fc[k] = catOf[id];
        else s.fn[k]++;
      }
      if (s.fc[k] >= 0 && s.fn[k] === size[s.fc[k]]) {
        s.fc[k] = -1;
        s.fn[k] = 0;
        s.done++;
      }
    }
    function runStart(col) {
      let st = col.length - 1;
      if (st < 0 || col[st] < 0) return -1;
      while (st > 0) {
        const prev = col[st - 1];
        const cur = col[st];
        if (prev < 0 || isCat[cur] || catOf[prev] !== catOf[cur]) break;
        st--;
      }
      return st;
    }

    function expand(s) {
      const out = [];
      const w = s.waste.length ? s.waste[s.waste.length - 1] : -1;
      const wi = s.waste.length - 1;

      // Words onto their own set's slot are always safe: take the first one as the only move.
      if (w >= 0 && !isCat[w]) {
        const k = s.fc.indexOf(catOf[w]);
        if (k >= 0) {
          const n = clone(s);
          n.waste.pop();
          toFound(n, [w], k);
          n.move = { from: 'waste', index: wi, to: 'f' + k };
          return [n];
        }
      }
      for (let c = 0; c < T; c++) {
        const st = runStart(s.tab[c]);
        if (st < 0 || isCat[s.tab[c][st]]) continue;
        const k = s.fc.indexOf(catOf[s.tab[c][st]]);
        if (k < 0) continue;
        const n = clone(s);
        const run = n.tab[c].splice(st);
        flipTop(n.tab[c]);
        toFound(n, run, k);
        n.move = { from: 't' + c, index: st, to: 'f' + k };
        return [n];
      }

      const emptyF = s.fc.indexOf(-1);
      let emptyCol = -1;
      for (let c = 0; c < T; c++) if (!s.tab[c].length) {
        emptyCol = c;
        break;
      }

      for (let c = 0; c < T; c++) {
        const col = s.tab[c];
        const st = runStart(col);
        if (st < 0) continue;
        const base = col[st];
        if (isCat[base] && emptyF >= 0) {
          const n = clone(s);
          const run = n.tab[c].splice(st);
          flipTop(n.tab[c]);
          toFound(n, run, emptyF);
          n.move = { from: 't' + c, index: st, to: 'f' + emptyF };
          out.push(n);
        }
        if (!isCat[base]) {
          for (let d = 0; d < T; d++) {
            if (d === c || !s.tab[d].length) continue;
            const t = s.tab[d][s.tab[d].length - 1];
            if (t < 0 || catOf[t] !== catOf[base]) continue;
            const n = clone(s);
            const run = n.tab[c].splice(st);
            flipTop(n.tab[c]);
            n.tab[d].push(...run);
            n.move = { from: 't' + c, index: st, to: 't' + d };
            out.push(n);
          }
        }
        if (st > 0 && emptyCol >= 0) {
          const n = clone(s);
          const run = n.tab[c].splice(st);
          flipTop(n.tab[c]);
          n.tab[emptyCol].push(...run);
          n.move = { from: 't' + c, index: st, to: 't' + emptyCol };
          out.push(n);
        }
      }

      if (w >= 0) {
        if (isCat[w] && emptyF >= 0) {
          const n = clone(s);
          n.waste.pop();
          toFound(n, [w], emptyF);
          n.move = { from: 'waste', index: wi, to: 'f' + emptyF };
          out.push(n);
        }
        if (!isCat[w]) {
          for (let d = 0; d < T; d++) {
            if (!s.tab[d].length) continue;
            const t = s.tab[d][s.tab[d].length - 1];
            if (t < 0 || catOf[t] !== catOf[w]) continue;
            const n = clone(s);
            n.waste.pop();
            n.tab[d].push(w);
            n.move = { from: 'waste', index: wi, to: 't' + d };
            out.push(n);
          }
        }
        if (emptyCol >= 0) {
          const n = clone(s);
          n.waste.pop();
          n.tab[emptyCol].push(w);
          n.move = { from: 'waste', index: wi, to: 't' + emptyCol };
          out.push(n);
        }
      }

      if (s.stock.length) {
        const n = clone(s);
        n.waste.push(n.stock.pop());
        n.move = { draw: true };
        out.push(n);
      } else if (s.waste.length > 1) {
        const n = clone(s);
        n.stock = n.waste.reverse();
        n.waste = [];
        n.move = { draw: true };
        out.push(n);
      }
      return out;
    }

    const heap = Heap();
    const seen = new Map();
    root.f = WEIGHT * h(root);
    seen.set(key(root), 0);
    heap.push(root);
    let nodes = 0;
    while (heap.size && nodes < maxNodes) {
      const s = heap.pop();
      nodes++;
      if (s.done === ncat) {
        const path = [];
        for (let x = s; x.parent; x = x.parent) path.push(x.move);
        return path.reverse();
      }
      for (const n of expand(s)) {
        const k = key(n);
        const prev = seen.get(k);
        if (prev !== undefined && prev <= n.g) continue;
        seen.set(k, n.g);
        n.f = n.g + WEIGHT * h(n);
        heap.push(n);
      }
    }
    return null;
  }

  // ---------- Layout & drawing ----------

  function layout(g, W, H) {
    const T = g.T;
    const F = g.F;
    const pad = Math.round(Math.max(6, Math.min(16, W * 0.025)));
    const gapR = 0.12;
    const portrait = W < H * 0.95;
    let cw;
    if (portrait) {
      const cols = Math.max(T, F);
      cw = Math.min((W - 2 * pad) / (cols + (cols - 1) * gapR), (H - 2 * pad) / (1.4 * 3.3), 132);
    } else {
      const cols = Math.max(T, F + 3);
      cw = Math.min((W - 2 * pad) / (cols + (cols - 1) * gapR), (H - 2 * pad) / (1.4 * 2.75), 132);
    }
    cw = Math.max(30, Math.floor(cw));
    const ch = Math.round(cw * 1.4);
    const gap = Math.max(4, Math.round(cw * gapR));
    const rowX = (n, i) => Math.round((W - (n * cw + (n - 1) * gap)) / 2 + i * (cw + gap));
    const slots = {};
    const ty = pad + ch + Math.round(gap * 1.6);
    if (portrait) {
      for (let i = 0; i < F; i++) slots['f' + i] = { x: rowX(F, i), y: pad, type: 'catf' };
      const by = H - pad - ch;
      for (let i = 0; i < T; i++) slots['t' + i] = { x: rowX(T, i), y: ty, type: 'fan', maxY: by - gap };
      slots.stock = { x: rowX(T, T - 1), y: by, type: 'stack' };
      slots.waste = { x: rowX(T, T - 2), y: by, type: 'waste', fan: 1 };
    } else {
      const n = F + 3;
      slots.stock = { x: rowX(n, 0), y: pad, type: 'stack' };
      slots.waste = { x: rowX(n, 1), y: pad, type: 'waste', fan: 1 };
      for (let i = 0; i < F; i++) slots['f' + i] = { x: rowX(n, 3 + i), y: pad, type: 'catf' };
      for (let i = 0; i < T; i++) slots['t' + i] = { x: rowX(T, i), y: ty, type: 'fan', maxY: H - pad };
    }
    slots.done = { type: 'gone' };
    return { cw, ch, slots, fanDown: 0.1, fanUp: 0.33 };
  }

  function slotLabel(g, pile) {
    if (pile === 'done') return null;
    if (pile === 'stock') return PX.icon('recycle');
    if (pile[0] === 'f') return PX.icon('star');
    return '';
  }

  // Font size class from the longest word and the total length, so names fit in the card's top strip.
  function sizeClass(label) {
    const longest = Math.max(...label.split(/\s+/).map((w) => w.length));
    if (longest >= 13 || label.length > 22) return ' xs';
    if (longest >= 9 || label.length > 15) return ' sm';
    return '';
  }

  // Readable text colour on a category colour.
  function inkOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return l > 160 ? '#1d1a2b' : '#ffffff';
  }

  function faceHTML(g, c) {
    if (c.kind === 'cat') {
      const cat = g.cats[c.cat];
      return (
        `<div class="cf catc" style="--cc:${cat.color};--ct:${inkOn(cat.color)}">` +
        `<div class="cc-name${sizeClass(c.label)}">${S.esc(c.label)}</div>` +
        `<div class="cc-icon">${PX.icon(cat.icon)}</div>` +
        `<div class="cc-count">&times;${cat.size}</div></div>`
      );
    }
    return (
      `<div class="cf item"><div class="it-name${sizeClass(c.label)}">${S.esc(c.label)}</div>` +
      `<div class="it-icon">${PX.icon(g.mode === 'geo' ? 'flag' : 'person')}</div></div>`
    );
  }

  // Keep each category card's counter up to date ("3/5" on a slot, "x5" elsewhere).
  function decorate(g, el, c, pile) {
    if (c.kind !== 'cat') return;
    const box = el.querySelector('.cc-count');
    const size = g.cats[c.cat].size;
    const text = pile[0] === 'f' ? `${g.p[pile].length - 1}/${size}` : `×${size}`;
    if (box.textContent !== text) box.textContent = text;
    el.classList.toggle('on-slot', pile[0] === 'f');
  }

  const cardName = (g, c) => (c.kind === 'cat' ? `${c.label} category card, ${g.cats[c.cat].size} cards` : c.label);

  function hud(g, settings) {
    const limit = settings.limit;
    const left = movesLeft(g);
    return [
      limit ? { label: 'Moves left', value: Math.max(0, left), warn: left <= 10 } : { label: 'Moves', value: g.n.moves },
      { label: 'Time', value: S.fmtTime(g.n.time) },
      { label: 'Sets', value: `${g.n.sets}/${g.cats.length}` },
    ];
  }

  function canvasInfo(g, c) {
    if (c.kind === 'cat') {
      const cat = g.cats[c.cat];
      return { bg: cat.color, fg: inkOn(cat.color), text: c.label, sprite: PX.G[cat.icon], spriteColors: { X: inkOn(cat.color) } };
    }
    return { bg: PX.C.cream, fg: PX.C.black, text: c.label };
  }

  function cascadeOrder(g) {
    return g.p.done.map((c) => ({ id: c.id, pile: c.at }));
  }

  function stars(g) {
    const left = movesLeft(g) / Math.max(1, g.n.budget);
    return left >= 0.3 ? 3 : left >= 0.12 ? 2 : 1;
  }

  S.Category = {
    id: 'category',
    DIFF,
    newGame,
    deal,
    solve,
    piles,
    canPickUp,
    canDrop,
    applyMove,
    draw,
    isWon,
    isLost,
    movesLeft,
    autoTarget,
    hint,
    layout,
    slotLabel,
    faceHTML,
    decorate,
    cardName,
    hud,
    canvasInfo,
    cascadeOrder,
    stars,
  };
})();
