// App flow: home screen, starting/continuing games, undo, hints, win/lose, stats and settings.
(function () {
  const S = globalThis.Sol;
  const PX = S.PX;
  const $ = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];

  const RULES = { classic: S.Klondike, geo: S.Category, games: S.Category, screen: S.Category };
  const TITLES = { classic: 'Classic', geo: 'Countries', games: 'Games', screen: 'TV & Movies' };
  const DIFF_NAMES = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
  const PACK_NAMES = { mix: 'TV + Movies', tv: 'TV only', movie: 'Movies only' };
  const FELTS = {
    green: ['#2f7d4f', '#286c44'],
    blue: ['#2b5c8f', '#244f7b'],
    purple: ['#5b3f8c', '#4e357a'],
    red: ['#8c3434', '#782c2c'],
  };
  const BACKS = {
    blue: ['#3156a8', '#6e93e6'],
    red: ['#a83131', '#e67a6e'],
    green: ['#2e7a4a', '#7ed49c'],
    gold: ['#8a5f10', '#f2c230'],
  };

  const settings = Object.assign({ sound: true, tap: true, limit: true, felt: 'green', back: 'blue' }, S.store.get('ps.settings', {}));
  const prefs = { classic: { draw: 1 }, geo: { diff: 'normal' }, games: { diff: 'normal' }, screen: { diff: 'normal', pack: 'mix' } };
  S.store.del('ps.save.fandom'); // saves from the old combined Characters mode
  Object.entries(S.store.get('ps.prefs', {})).forEach(([k, v]) => prefs[k] && Object.assign(prefs[k], v));
  const stats = S.store.get('ps.stats', {});

  let G = null;
  let rules = null;
  let family = null;
  let undoStack = [];
  let startSnap = null;
  let over = false;
  let busy = false;

  const board = new S.Board($('#board'), {
    move: onMove,
    tap: onTap,
    draw: onDraw,
    pick: () => S.sound.play('pick'),
  });

  // ---------- Theme ----------

  function applyTheme() {
    const root = document.documentElement.style;
    const [f1, f2] = FELTS[settings.felt] || FELTS.green;
    root.setProperty('--felt', f1);
    root.setProperty('--felt2', f2);
    const [b1, b2] = BACKS[settings.back] || BACKS.blue;
    root.setProperty('--back-img', PX.backImage(b1, b2));
    root.setProperty('--back-edge', b2);
    S.sound.on = settings.sound;
  }

  // ---------- Helpers ----------

  const variantKey = (fam, o) => (fam === 'classic' ? `classic-d${o.draw}` : `${fam}-${o.diff}`);
  function variantName(fam, o) {
    if (fam === 'classic') return `Draw ${o.draw}`;
    if (fam === 'screen') return `${DIFF_NAMES[o.diff]} · ${PACK_NAMES[o.pack] || PACK_NAMES.mix}`;
    return DIFF_NAMES[o.diff];
  }
  const rec = (key) => (stats[key] = stats[key] || { played: 0, won: 0, best: null, bestMoves: null, streak: 0, bestStreak: 0 });
  const saveStats = () => S.store.set('ps.stats', stats);

  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  }

  let toastTimer = 0;
  function toast(msg, ms = 1800, big = false) {
    const t = $('#toast');
    clearTimeout(toastTimer);
    if (!msg) return t.classList.remove('show');
    t.textContent = msg;
    t.classList.toggle('big', big);
    t.classList.add('show');
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function modal({ title, html, buttons, dismiss = true }) {
    const m = $('#modal');
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    const bar = $('#modal-actions');
    bar.innerHTML = '';
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.cls || '');
      el.textContent = b.label;
      el.addEventListener('click', b.fn);
      bar.appendChild(el);
    });
    m.dataset.dismiss = dismiss ? '1' : '';
    m.hidden = false;
    const first = bar.querySelector('.primary') || bar.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }
  const closeModal = () => ($('#modal').hidden = true);
  const isModalOpen = () => !$('#modal').hidden;

  const statRows = (rows) =>
    `<dl class="stat-rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

  // ---------- Game lifecycle ----------

  const snap = () => JSON.stringify({ p: G.p, n: G.n });

  function restore(s) {
    const o = JSON.parse(s);
    const { time, started } = G.n;
    G.p = o.p;
    G.n = o.n;
    G.n.time = time;
    G.n.started = started;
  }

  function startGame(fam) {
    if (busy) return;
    busy = true;
    const o = fam === 'classic' ? { draw: prefs.classic.draw } : { kind: fam, diff: prefs[fam].diff, pack: prefs[fam].pack || 'mix' };
    if (fam !== 'classic') toast('Shuffling…', 900);
    // Let the toast paint before the deal is solved.
    setTimeout(() => {
      let g;
      try {
        g = RULES[fam].newGame(o, S.newSeed());
      } finally {
        busy = false;
      }
      load(fam, g, [], null);
      S.sound.play('shuffle');
      save();
    }, 30);
  }

  function load(fam, g, undo, start) {
    family = fam;
    rules = RULES[fam];
    G = g;
    undoStack = undo || [];
    startSnap = start || snap();
    over = false;
    closeModal();
    S.FX.stopCascade();
    $('#hud-mode').textContent = TITLES[fam];
    $('#hud-sub').textContent = variantName(fam, G.opts);
    show('screen-game');
    board.setGame(G, rules);
    updateHud();
    updateTools();
    if (settings.limit && rules.isLost(G)) {
      over = true;
      setTimeout(lose, 300);
    }
  }

  function save() {
    if (!G || rules.isWon(G)) return;
    S.store.set('ps.save.' + family, { g: G, undo: undoStack.slice(-50), start: startSnap });
  }

  function continueGame(fam) {
    const s = S.store.get('ps.save.' + fam);
    if (s && s.g) load(fam, s.g, s.undo, s.start);
  }

  // Run a rules action; if it changed anything, record undo and react to its events.
  function act(fn) {
    if (over || busy) return false;
    const before = snap();
    const ev = fn();
    if (!ev) return false;
    undoStack.push(before);
    if (undoStack.length > 300) undoStack.shift();
    if (!G.n.started) {
      G.n.started = true;
      rec(variantKey(family, G.opts)).played++;
      saveStats();
    }
    afterEvents(ev);
    return true;
  }

  function afterEvents(ev) {
    board.render();
    if (ev.includes('win')) S.sound.play('win');
    else if (ev.includes('complete')) S.sound.play('complete');
    else if (ev.includes('found')) S.sound.play('found');
    else if (ev.includes('flip')) S.sound.play('flip');
    else if (ev.includes('draw') || ev.includes('recycle')) S.sound.play('draw');
    else S.sound.play('place');
    if (ev.includes('complete') && G.n.lastSet) celebrateSet(G.n.lastSet);
    updateHud();
    updateTools();
    save();
    if (ev.includes('win')) return win();
    if (settings.limit && rules.isLost(G)) {
      over = true;
      setTimeout(lose, 450);
    }
  }

  function celebrateSet({ pile, cat }) {
    const c = board.pileCenter(pile);
    S.FX.burst(c.x, c.y, [G.cats[cat].color, '#ffffff', '#f2c230']);
    toast(`${G.cats[cat].name} complete!`, 1600, true);
    if (navigator.vibrate) navigator.vibrate(25);
  }

  // ---------- Board hooks ----------

  function onMove(from, i, to) {
    if (over || busy || !rules.canDrop(G, from, i, to)) {
      board.render();
      return;
    }
    act(() => rules.applyMove(G, from, i, to));
  }

  function onTap(pile, i) {
    if (over || busy || !settings.tap) return;
    const card = G.p[pile][i];
    if (!card || !card.up) return;
    const to = rules.canPickUp(G, pile, i) ? rules.autoTarget(G, pile, i) : null;
    if (to) act(() => rules.applyMove(G, pile, i, to));
    else {
      board.shake(pile, i);
      S.sound.play('bad');
    }
  }

  function onDraw() {
    if (over || busy) return;
    if (!act(() => rules.draw(G))) S.sound.play('bad');
  }

  // ---------- Toolbar ----------

  function undo() {
    if (!G || busy || rules.isWon(G)) return;
    if (!undoStack.length) {
      S.sound.play('bad');
      return;
    }
    restore(undoStack.pop());
    over = false;
    closeModal();
    board.render();
    updateHud();
    updateTools();
    save();
    S.sound.play('draw');
  }

  function hint() {
    if (!G || over || busy) return;
    const h = rules.hint(G);
    if (!h) {
      toast(family === 'classic' ? 'No moves found. Try Undo or a new game.' : 'No way to win from here. Try Undo.', 2600);
      S.sound.play('bad');
      return;
    }
    S.sound.play('hint');
    if (h.draw) return board.flash('stock');
    board.flash(h.from, h.index);
    setTimeout(() => board.flash(h.to), 300);
    if (family !== 'classic' && settings.limit && h.total > rules.movesLeft(G)) toast('Careful: moves are running low!', 2400);
  }

  function autoFinish() {
    if (!G || !rules.canAutoFinish || !rules.canAutoFinish(G) || busy || over) return;
    board.locked = true;
    const step = () => {
      const m = rules.autoStep(G);
      const ok = m && act(() => rules.applyMove(G, m.from, m.index, m.to));
      if (!ok || over || rules.isWon(G)) {
        board.locked = false;
        return;
      }
      setTimeout(step, 90);
    };
    step();
  }

  function newGamePressed() {
    if (busy) return;
    if (G && G.n.started && !over) {
      modal({
        title: 'New game?',
        html: '<p>This game will count as a loss.</p>',
        buttons: [
          { label: 'Deal', cls: 'primary', fn: () => { abandon(); startGame(family); } },
          { label: 'Cancel', fn: closeModal },
        ],
      });
    } else startGame(family);
  }

  function abandon() {
    if (G && G.n.started && !over) {
      rec(variantKey(family, G.opts)).streak = 0;
      saveStats();
    }
    closeModal();
  }

  function goHome() {
    if (G && !over) save();
    S.FX.stopCascade();
    closeModal();
    show('screen-home');
    refreshHome();
  }

  function updateHud() {
    $('#hud-stats').innerHTML = rules
      .hud(G, settings)
      .map((it) => `<div class="hud-stat${it.warn ? ' warn' : ''}"><small>${it.label}</small><b>${it.value}</b></div>`)
      .join('');
  }

  function updateTools() {
    $('#btn-undo').disabled = !undoStack.length;
    $('#btn-auto').hidden = !(rules.canAutoFinish && rules.canAutoFinish(G));
  }

  // ---------- Win / lose ----------

  function win() {
    over = true;
    const r = rec(variantKey(family, G.opts));
    r.won++;
    r.streak++;
    r.bestStreak = Math.max(r.bestStreak, r.streak);
    if (r.best == null || G.n.time < r.best) r.best = G.n.time;
    if (r.bestMoves == null || G.n.moves < r.bestMoves) r.bestMoves = G.n.moves;
    saveStats();
    S.store.del('ps.save.' + family);
    updateTools();
    const cards = rules.cascadeOrder(G).map(({ id, pile }) => ({ info: rules.canvasInfo(G, G.deck[id]), ...board.pileRect(pile) }));
    setTimeout(() => S.FX.runCascade(cards, winModal), 400);
  }

  function winModal() {
    const cat = family !== 'classic';
    const rows = [['Time', S.fmtTime(G.n.time)], ['Moves', G.n.moves]];
    if (!cat) rows.push(['Score', G.n.score]);
    else if (settings.limit) rows.push(['Moves left', rules.movesLeft(G)]);
    let stars = '';
    if (cat && settings.limit) {
      const n = rules.stars(G);
      stars = `<div class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => `<span class="${i <= n ? 'on' : ''}">${PX.icon('star')}</span>`).join('')}</div>`;
    }
    modal({
      title: 'You win!',
      html: stars + statRows(rows),
      dismiss: false,
      buttons: [
        { label: 'New game', cls: 'primary', fn: () => startGame(family) },
        { label: 'Menu', fn: goHome },
      ],
    });
  }

  function lose() {
    if (!over || rules.isWon(G)) return;
    rec(variantKey(family, G.opts)).streak = 0;
    saveStats();
    S.sound.play('lose');
    modal({
      title: 'Out of moves',
      html: `<p>You cleared ${G.n.sets} of ${G.cats.length} sets.</p><p class="muted">Undo to try another way, or replay the same deal.</p>`,
      dismiss: false,
      buttons: [
        { label: 'Undo', fn: undo },
        { label: 'Retry deal', fn: retry },
        { label: 'New game', cls: 'primary', fn: () => startGame(family) },
      ],
    });
  }

  function retry() {
    closeModal();
    const o = JSON.parse(startSnap);
    G.p = o.p;
    G.n = o.n;
    G.n.time = 0;
    G.n.started = false;
    undoStack = [];
    over = false;
    board.setGame(G, rules);
    updateHud();
    updateTools();
    save();
    S.sound.play('shuffle');
  }

  // ---------- Timer ----------

  setInterval(() => {
    if (!G || over || !G.n.started || document.hidden || isModalOpen()) return;
    if (!$('#screen-game').classList.contains('active')) return;
    G.n.time++;
    updateHud();
    if (G.n.time % 10 === 0) save();
  }, 1000);
  document.addEventListener('visibilitychange', () => document.hidden && G && !over && save());

  // ---------- Home ----------

  const mini = (face) => `<div class="card up mini"><div class="ci"><div class="face">${face}</div></div></div>`;

  function buildArt() {
    const K = S.Klondike;
    $('#hero-cards').innerHTML =
      mini(K.faceHTML(null, { suit: 3, rank: 11 })) + mini(K.faceHTML(null, { suit: 2, rank: 12 })) + mini(K.faceHTML(null, { suit: 1, rank: 13 }));
    $('[data-preview="classic"]').innerHTML = mini(K.faceHTML(null, { suit: 0, rank: 1 })) + mini(K.faceHTML(null, { suit: 1, rank: 7 }));
    const geo = { mode: 'geo', cats: [{ name: 'Asia', color: '#d9a21b', icon: 'globe', size: 5 }] };
    $('[data-preview="geo"]').innerHTML =
      mini(S.Category.faceHTML(geo, { kind: 'cat', cat: 0, label: 'Asia' })) + mini(S.Category.faceHTML(geo, { kind: 'item', cat: 0, label: 'Japan' }));
    const games = { mode: 'games', cats: [{ name: 'Super Mario', color: '#d6453d', icon: 'game', size: 5 }] };
    $('[data-preview="games"]').innerHTML =
      mini(S.Category.faceHTML(games, { kind: 'cat', cat: 0, label: 'Super Mario' })) + mini(S.Category.faceHTML(games, { kind: 'item', cat: 0, label: 'Luigi' }));
    const screen = { mode: 'screen', cats: [{ name: 'Star Wars', color: '#9b59d0', icon: 'movie', size: 6 }] };
    $('[data-preview="screen"]').innerHTML =
      mini(S.Category.faceHTML(screen, { kind: 'cat', cat: 0, label: 'Star Wars' })) + mini(S.Category.faceHTML(screen, { kind: 'item', cat: 0, label: 'Yoda' }));
    $$('[data-icon]').forEach((el) => (el.innerHTML = PX.icon(el.dataset.icon)));
  }

  function refreshHome() {
    $$('.mode').forEach((m) => {
      const fam = m.dataset.mode;
      $$('.chips', m).forEach((group) => {
        const opt = group.dataset.opt;
        $$('button', group).forEach((b) => {
          const on = String(prefs[fam][opt]) === b.dataset.v;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on);
        });
      });
      const s = S.store.get('ps.save.' + fam);
      $('[data-continue]', m).hidden = !(s && s.g);
    });
  }

  $$('.mode').forEach((m) => {
    const fam = m.dataset.mode;
    m.addEventListener('click', (e) => {
      const chip = e.target.closest('.chips button');
      if (chip) {
        const opt = chip.parentElement.dataset.opt;
        prefs[fam][opt] = opt === 'draw' ? Number(chip.dataset.v) : chip.dataset.v;
        S.store.set('ps.prefs', prefs);
        refreshHome();
        S.sound.play('pick');
        return;
      }
      if (e.target.closest('[data-continue]')) return continueGame(fam);
      if (e.target.closest('[data-play]')) {
        const s = S.store.get('ps.save.' + fam);
        if (s && s.g && s.g.n.started) {
          modal({
            title: 'New game?',
            html: '<p>Your saved game in this mode will be replaced and count as a loss.</p>',
            buttons: [
              {
                label: 'Deal',
                cls: 'primary',
                fn: () => {
                  rec(variantKey(fam, s.g.opts)).streak = 0;
                  saveStats();
                  closeModal();
                  startGame(fam);
                },
              },
              { label: 'Cancel', fn: closeModal },
            ],
          });
        } else startGame(fam);
      }
    });
  });

  // ---------- Settings, stats, help ----------

  function openSettings() {
    const toggle = (key, label, note) =>
      `<div class="set-row"><div><b>${label}</b>${note ? `<small>${note}</small>` : ''}</div>` +
      `<button class="switch ${settings[key] ? 'on' : ''}" data-set="${key}" aria-pressed="${settings[key]}">${settings[key] ? 'ON' : 'OFF'}</button></div>`;
    const choice = (key, label, options) =>
      `<div class="set-row col"><b>${label}</b><div class="swatches">` +
      Object.entries(options)
        .map(([k, [a, b]]) => `<button class="swatch ${settings[key] === k ? 'on' : ''}" data-choice="${key}" data-v="${k}" style="--a:${a};--b:${b}" aria-label="${k}" aria-pressed="${settings[key] === k}"></button>`)
        .join('') +
      '</div></div>';
    modal({
      title: 'Settings',
      html:
        toggle('sound', 'Sound') +
        toggle('tap', 'Tap to move', 'Tap a card to send it to the best spot.') +
        toggle('limit', 'Move limit', 'Every mode except Classic.') +
        choice('felt', 'Table', FELTS) +
        choice('back', 'Card back', BACKS),
      buttons: [{ label: 'Done', cls: 'primary', fn: closeModal }],
    });
    $('#modal-body').onclick = (e) => {
      const sw = e.target.closest('[data-set]');
      const ch = e.target.closest('[data-choice]');
      if (sw) settings[sw.dataset.set] = !settings[sw.dataset.set];
      else if (ch) settings[ch.dataset.choice] = ch.dataset.v;
      else return;
      S.store.set('ps.settings', settings);
      applyTheme();
      S.sound.play('pick');
      if (G && rules) updateHud();
      openSettings();
    };
  }

  function openStats() {
    const rows = [];
    const names = { 'classic-d1': 'Classic · Draw 1', 'classic-d3': 'Classic · Draw 3' };
    for (const fam of ['geo', 'games', 'screen']) {
      for (const d of ['easy', 'normal', 'hard']) names[`${fam}-${d}`] = `${TITLES[fam]} · ${DIFF_NAMES[d]}`;
    }
    const order = Object.keys(names);
    for (const k of order) {
      const r = stats[k];
      if (!r || !r.played) continue;
      rows.push(
        `<tr><th>${names[k]}</th><td>${r.won}/${r.played}</td><td>${Math.round((100 * r.won) / r.played)}%</td>` +
          `<td>${r.best != null ? S.fmtTime(r.best) : '–'}</td><td>${r.bestStreak}</td></tr>`
      );
    }
    modal({
      title: 'Stats',
      html: rows.length
        ? `<div class="table-wrap"><table class="stats"><thead><tr><th></th><th>Won</th><th>Rate</th><th>Best</th><th>Streak</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`
        : '<p>No games played yet.</p>',
      buttons: [{ label: 'Close', cls: 'primary', fn: closeModal }],
    });
  }

  function openHelp() {
    modal({
      title: 'How to play',
      html: `
        <h3>Classic</h3>
        <p>Move every card to the four top-right piles, from Ace to King in one suit.</p>
        <p>In the columns, put cards on a card one rank higher of the other colour (red 9 on black 10). Only a King can go into an empty column. Tap the deck to turn over new cards.</p>
        <h3>Countries, Games, TV &amp; Movies</h3>
        <p>Each set has one coloured <b>category card</b> (a continent, a game, a show or a movie) and some <b>word cards</b> (countries or characters).</p>
        <p>Put a category card on an empty <span class="kbd">${PX.icon('star')}</span> slot, then add every word that belongs to it. A full set clears and frees the slot.</p>
        <p>In the columns, a word can go on a word or category card of the same set. Any card can go into an empty column.</p>
        <p>The counter on a category card shows how many words it needs. Every move and every draw uses up one move, so plan ahead!</p>
        <h3>Controls</h3>
        <p>Drag cards, or tap a card to send it to the best spot. Keyboard: <span class="kbd">Space</span> draw, <span class="kbd">U</span> undo, <span class="kbd">H</span> hint.</p>`,
      buttons: [{ label: 'Got it', cls: 'primary', fn: closeModal }],
    });
  }

  // ---------- Wiring ----------

  $('#btn-menu').addEventListener('click', goHome);
  $('#btn-new').addEventListener('click', newGamePressed);
  $('#btn-undo').addEventListener('click', undo);
  $('#btn-hint').addEventListener('click', hint);
  $('#btn-auto').addEventListener('click', autoFinish);
  $$('[data-open]').forEach((b) =>
    b.addEventListener('click', () => ({ settings: openSettings, stats: openStats, help: openHelp })[b.dataset.open]())
  );
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal' && $('#modal').dataset.dismiss) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (isModalOpen()) {
      if (e.key === 'Escape' && $('#modal').dataset.dismiss) closeModal();
      return;
    }
    if (!$('#screen-game').classList.contains('active')) return;
    const k = e.key.toLowerCase();
    if (((e.ctrlKey || e.metaKey) && k === 'z') || k === 'u') {
      e.preventDefault();
      undo();
    } else if (k === 'h') hint();
    else if (k === ' ' || k === 'd') {
      e.preventDefault();
      onDraw();
    } else if (k === 'escape') goHome();
  });

  applyTheme();
  buildArt();
  refreshHome();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
