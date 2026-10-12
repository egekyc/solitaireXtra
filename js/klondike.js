// Classic Klondike rules.
// State: g.p holds every pile as an array of { id, up } (top card last); g.deck[id] = { suit, rank }.
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});
  const PX = S.PX;

  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RANK_NAMES = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
  const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
  const FOUND = ['f0', 'f1', 'f2', 'f3'];
  const TAB = ['t0', 't1', 't2', 't3', 't4', 't5', 't6'];

  const isRed = (c) => c.suit === 1 || c.suit === 2;
  const top = (pile) => pile[pile.length - 1];

  function newGame(opts, seed) {
    const rnd = S.rng(seed);
    const deck = [];
    for (let suit = 0; suit < 4; suit++) for (let rank = 1; rank <= 13; rank++) deck.push({ id: deck.length, suit, rank });
    const order = S.shuffle(deck.map((c) => c.id), rnd);
    const p = { stock: [], waste: [] };
    FOUND.forEach((f) => (p[f] = []));
    let k = 0;
    TAB.forEach((t, i) => {
      p[t] = [];
      for (let j = 0; j <= i; j++) p[t].push({ id: order[k++], up: j === i });
    });
    while (k < order.length) p.stock.push({ id: order[k++], up: false });
    return {
      mode: 'classic',
      opts: { draw: opts.draw === 3 ? 3 : 1 },
      seed,
      deck,
      p,
      n: { moves: 0, score: 0, time: 0 },
    };
  }

  const piles = () => ['stock', 'waste', ...FOUND, ...TAB];

  // A face-up run where each card is one lower and the opposite colour of the card under it.
  function isRun(g, cards, i) {
    if (!cards[i] || !cards[i].up) return false;
    for (let j = i + 1; j < cards.length; j++) {
      const a = g.deck[cards[j - 1].id];
      const b = g.deck[cards[j].id];
      if (!cards[j].up || b.rank !== a.rank - 1 || isRed(a) === isRed(b)) return false;
    }
    return true;
  }

  function canPickUp(g, pile, i) {
    const cards = g.p[pile];
    if (!cards || i < 0 || i >= cards.length) return false;
    if (pile === 'stock') return false;
    if (pile === 'waste' || pile[0] === 'f') return i === cards.length - 1;
    return isRun(g, cards, i);
  }

  function canDrop(g, from, i, to) {
    if (from === to || !canPickUp(g, from, i)) return false;
    const moving = g.p[from].slice(i);
    const base = g.deck[moving[0].id];
    const dest = g.p[to];
    if (to[0] === 'f') {
      if (moving.length !== 1) return false;
      if (!dest.length) return base.rank === 1;
      const t = g.deck[top(dest).id];
      return t.suit === base.suit && base.rank === t.rank + 1;
    }
    if (to[0] === 't') {
      if (!dest.length) return base.rank === 13;
      const tc = top(dest);
      const t = g.deck[tc.id];
      return tc.up && base.rank === t.rank - 1 && isRed(t) !== isRed(base);
    }
    return false;
  }

  function addScore(g, pts) {
    g.n.score = Math.max(0, g.n.score + pts);
  }

  function applyMove(g, from, i, to) {
    const moving = g.p[from].splice(i);
    moving.forEach((c) => (c.up = true));
    g.p[to].push(...moving);
    const ev = ['move'];
    if (to[0] === 'f') {
      ev.push('found');
      addScore(g, 10);
    } else if (from === 'waste') addScore(g, 5);
    else if (from[0] === 'f') addScore(g, -15);
    const rest = g.p[from];
    if (from[0] === 't' && rest.length && !top(rest).up) {
      top(rest).up = true;
      addScore(g, 5);
      ev.push('flip');
    }
    g.n.moves++;
    if (isWon(g)) ev.push('win');
    return ev;
  }

  function draw(g) {
    const { stock, waste } = g.p;
    if (stock.length) {
      for (let k = 0; k < g.opts.draw && stock.length; k++) {
        const c = stock.pop();
        c.up = true;
        waste.push(c);
      }
      g.n.moves++;
      return ['draw'];
    }
    if (waste.length) {
      g.p.stock = waste.reverse().map((c) => ({ id: c.id, up: false }));
      g.p.waste = [];
      addScore(g, g.opts.draw === 1 ? -100 : -20);
      g.n.moves++;
      return ['recycle'];
    }
    return null;
  }

  const isWon = (g) => FOUND.every((f) => g.p[f].length === 13);
  const isLost = () => false;

  // Best place for a tapped card: foundation first, then another column, then an empty column.
  function autoTarget(g, from, i) {
    if (!canPickUp(g, from, i)) return null;
    for (const f of FOUND) if (canDrop(g, from, i, f)) return f;
    const tabs = TAB.filter((t) => t !== from);
    for (const t of tabs) if (g.p[t].length && canDrop(g, from, i, t)) return t;
    if (!(from[0] === 't' && i === 0)) for (const t of tabs) if (!g.p[t].length && canDrop(g, from, i, t)) return t;
    return null;
  }

  function hint(g) {
    const sources = [];
    if (g.p.waste.length) sources.push(['waste', g.p.waste.length - 1]);
    TAB.forEach((t) => {
      const cards = g.p[t];
      for (let i = 0; i < cards.length; i++) if (canPickUp(g, t, i)) sources.push([t, i]);
    });
    // 1. Anything to a foundation.
    for (const [from, i] of sources) {
      if (i !== g.p[from].length - 1) continue;
      for (const f of FOUND) if (canDrop(g, from, i, f)) return { from, index: i, to: f };
    }
    // 2. Column moves that turn over a face-down card or move a King out to an empty column usefully.
    for (const [from, i] of sources) {
      if (from === 'waste' || i === 0) continue;
      if (g.p[from][i - 1].up) continue;
      for (const t of TAB) if (t !== from && canDrop(g, from, i, t)) return { from, index: i, to: t };
    }
    // 3. Waste card onto the columns.
    if (g.p.waste.length) {
      const i = g.p.waste.length - 1;
      for (const t of TAB) if (g.p[t].length && canDrop(g, 'waste', i, t)) return { from: 'waste', index: i, to: t };
      for (const t of TAB) if (!g.p[t].length && canDrop(g, 'waste', i, t)) return { from: 'waste', index: i, to: t };
    }
    // 4. A whole column whose base is not a King can be moved to free its spot for a King.
    for (const [from, i] of sources) {
      if (from === 'waste' || i !== 0 || g.deck[g.p[from][0].id].rank === 13) continue;
      for (const t of TAB) if (t !== from && g.p[t].length && canDrop(g, from, i, t)) return { from, index: i, to: t };
    }
    if (g.p.stock.length || g.p.waste.length > 0) return { draw: true };
    return null;
  }

  // Auto-finish once every card is face up and the stock is empty.
  const canAutoFinish = (g) =>
    !isWon(g) && !g.p.stock.length && !g.p.waste.length && TAB.every((t) => g.p[t].every((c) => c.up));

  function autoStep(g) {
    let best = null;
    for (const from of ['waste', ...TAB]) {
      const cards = g.p[from];
      if (!cards.length) continue;
      const i = cards.length - 1;
      for (const f of FOUND) {
        if (!canDrop(g, from, i, f)) continue;
        const r = g.deck[cards[i].id].rank;
        if (!best || r < best.rank) best = { from, index: i, to: f, rank: r };
      }
    }
    return best;
  }

  function layout(g, W, H) {
    const pad = Math.round(Math.max(6, Math.min(16, W * 0.02)));
    const gapR = 0.1;
    let cw = Math.min((W - 2 * pad) / (7 + 6 * gapR), (H - 2 * pad) / (1.4 * 2.75), 118);
    cw = Math.max(24, Math.floor(cw));
    const ch = Math.round(cw * 1.4);
    const gap = Math.max(3, Math.round(cw * gapR));
    const total = 7 * cw + 6 * gap;
    const left = Math.round((W - total) / 2);
    const colX = (i) => left + i * (cw + gap);
    const slots = {
      stock: { x: colX(0), y: pad, type: 'stack' },
      waste: { x: colX(1), y: pad, type: 'waste', fan: g.opts.draw },
    };
    FOUND.forEach((f, i) => (slots[f] = { x: colX(3 + i), y: pad, type: 'stack' }));
    const ty = pad + ch + Math.round(gap * 1.6);
    TAB.forEach((t, i) => (slots[t] = { x: colX(i), y: ty, type: 'fan', maxY: H - pad }));
    return { cw, ch, slots, fanDown: 0.11, fanUp: 0.27 };
  }

  function slotLabel(g, pile) {
    if (pile === 'stock') return PX.icon('recycle');
    if (pile[0] === 'f') return '<span class="slot-a">A</span>';
    return '';
  }

  function faceHTML(g, c) {
    const red = isRed(c);
    const court = c.rank > 10;
    const mid = court ? PX.court(c.rank, c.suit) : PX.suit(c.suit, c.rank === 1 ? 'ace' : 'big');
    return (
      `<div class="cf classic ${red ? 'red' : 'black'}${court ? ' is-court' : ''}${c.rank === 10 ? ' ten' : ''}">` +
      `<span class="rk">${RANKS[c.rank]}</span><span class="st">${PX.suit(c.suit)}</span>` +
      `<div class="mid">${mid}</div></div>`
    );
  }

  const cardName = (g, c) => `${RANK_NAMES[c.rank]} of ${SUIT_NAMES[c.suit]}`;

  function hud(g) {
    return [
      { label: 'Moves', value: g.n.moves },
      { label: 'Time', value: S.fmtTime(g.n.time) },
      { label: 'Score', value: g.n.score },
    ];
  }

  // Data for drawing a card on the win-animation canvas.
  function canvasInfo(g, c) {
    return {
      bg: PX.C.cream,
      fg: PX.suitColor(c.suit),
      text: RANKS[c.rank],
      textFont: 'px',
      sprite: c.rank > 10 ? PX.G[{ 11: 'jack', 12: 'queen', 13: 'king' }[c.rank]] : PX.G['suit' + c.suit],
      spriteColors: c.rank > 10 ? PX.courtColors(c.suit) : { X: PX.suitColor(c.suit) },
    };
  }

  // Cards for the win cascade: the top of each foundation in turn, Kings first.
  function cascadeOrder(g) {
    const out = [];
    for (let r = 13; r >= 1; r--) FOUND.forEach((f) => {
      const c = g.p[f][r - 1];
      if (c) out.push({ id: c.id, pile: f });
    });
    return out;
  }

  S.Klondike = {
    id: 'classic',
    newGame,
    piles,
    canPickUp,
    canDrop,
    applyMove,
    draw,
    isWon,
    isLost,
    autoTarget,
    hint,
    canAutoFinish,
    autoStep,
    layout,
    slotLabel,
    faceHTML,
    cardName,
    hud,
    canvasInfo,
    cascadeOrder,
    RANKS,
  };
})();
