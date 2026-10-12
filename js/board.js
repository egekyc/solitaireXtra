// The play area: lays out piles, draws cards, and turns pointer input into moves.
// It works with any rules object (S.Klondike or S.Category) and talks back to the app via hooks:
//   hooks.move(fromPile, index, toPile), hooks.tap(pile, index), hooks.draw(), hooks.pick()
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});

  class Board {
    constructor(el, hooks) {
      this.el = el;
      this.hooks = hooks;
      this.cards = new Map(); // card id -> element
      this.slots = {}; // pile id -> element
      this.pos = new Map(); // card id -> { x, y, z, pile, index }
      this.where = new Map(); // card id -> pile at the last render
      this.down = null;
      this.locked = false;
      el.addEventListener('pointerdown', (e) => this.onDown(e));
      el.addEventListener('pointermove', (e) => this.onMove(e));
      el.addEventListener('pointerup', (e) => this.onUp(e));
      el.addEventListener('pointercancel', () => this.cancel());
      el.addEventListener('lostpointercapture', () => this.cancel());
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      if ('ResizeObserver' in window) new ResizeObserver(() => this.layout()).observe(el);
      else window.addEventListener('resize', () => this.layout());
    }

    setGame(g, rules) {
      this.g = g;
      this.rules = rules;
      this.down = null;
      this.el.innerHTML = '';
      this.cards.clear();
      this.pos.clear();
      this.where.clear();
      this.slots = {};
      this.geo = null;
      this.el.dataset.mode = g.mode;
      for (const pile of rules.piles(g)) {
        const label = rules.slotLabel(g, pile);
        if (label === null) continue;
        const s = document.createElement('div');
        s.className = 'slot slot-' + pile.replace(/\d+$/, '');
        s.dataset.pile = pile;
        s.innerHTML = label;
        this.el.appendChild(s);
        this.slots[pile] = s;
      }
      for (const c of g.deck) {
        const el = document.createElement('div');
        el.className = 'card';
        el.dataset.id = c.id;
        el.innerHTML = `<div class="ci"><div class="face">${rules.faceHTML(g, c)}</div><div class="back"></div></div>`;
        this.el.appendChild(el);
        this.cards.set(c.id, el);
      }
      this.layout();
    }

    layout() {
      if (!this.g) return;
      const W = this.el.clientWidth;
      const H = this.el.clientHeight;
      if (W < 60 || H < 60) return;
      this.geo = this.rules.layout(this.g, W, H);
      this.el.style.setProperty('--cw', this.geo.cw + 'px');
      this.el.style.setProperty('--ch', this.geo.ch + 'px');
      for (const [pile, s] of Object.entries(this.slots)) {
        const sl = this.geo.slots[pile];
        if (sl) s.style.transform = `translate(${sl.x}px, ${sl.y}px)`;
      }
      this.render(true);
    }

    // Where every card should be, from the piles and the layout.
    compute() {
      const { g, geo } = this;
      const { cw, ch } = geo;
      const out = new Map();
      for (const [pile, sl] of Object.entries(geo.slots)) {
        const cards = g.p[pile];
        if (!cards) continue;
        const n = cards.length;
        if (sl.type === 'fan') {
          let dDown = ch * geo.fanDown;
          let dUp = ch * geo.fanUp;
          let nd = 0;
          let nu = 0;
          for (let i = 0; i < n - 1; i++) cards[i].up ? nu++ : nd++;
          const room = sl.maxY - sl.y - ch;
          if (nd * dDown + nu * dUp > room) {
            dDown = Math.min(dDown, ch * 0.05);
            if (nu && nd * dDown + nu * dUp > room) dUp = Math.max(ch * 0.1, (room - nd * dDown) / nu);
          }
          let y = sl.y;
          cards.forEach((c, i) => {
            out.set(c.id, { x: sl.x, y: Math.round(y), z: i + 1, pile, index: i });
            y += c.up ? dUp : dDown;
          });
        } else if (sl.type === 'waste') {
          const start = Math.max(0, n - sl.fan);
          cards.forEach((c, i) => {
            const k = Math.max(0, i - start);
            out.set(c.id, { x: Math.round(sl.x + k * cw * 0.3), y: sl.y, z: i + 1, pile, index: i });
          });
        } else if (sl.type === 'gone') {
          cards.forEach((c, i) => {
            const at = geo.slots[c.at] || { x: (this.el.clientWidth - cw) / 2, y: 0 };
            out.set(c.id, { x: at.x, y: at.y, z: 300 + i, pile, index: i, gone: true });
          });
        } else {
          cards.forEach((c, i) => {
            const onTop = sl.type === 'catf' && g.deck[c.id].kind === 'cat';
            out.set(c.id, { x: sl.x, y: sl.y, z: onTop ? 200 : i + 1, pile, index: i });
          });
        }
      }
      return out;
    }

    render(instant) {
      if (!this.geo) return;
      if (instant) this.el.classList.add('instant');
      const pos = this.compute();
      for (const c of this.g.deck) {
        const el = this.cards.get(c.id);
        const p = pos.get(c.id);
        if (!p) {
          el.style.display = 'none';
          continue;
        }
        el.style.display = '';
        const card = this.g.p[p.pile][p.index];
        const wasUp = el.classList.contains('up');
        el.classList.toggle('up', !!card.up);
        if (card.up && !wasUp && !instant && this.where.has(c.id)) this.anim(el, 'flip', 260);
        el.classList.toggle('gone', !!p.gone);
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        clearTimeout(el._zt);
        const moved = this.where.has(c.id) && this.where.get(c.id) !== p.pile;
        if (moved && !instant) {
          el.style.zIndex = 600 + p.z;
          el._zt = setTimeout(() => (el.style.zIndex = p.z), 240);
        } else el.style.zIndex = p.z;
        this.where.set(c.id, p.pile);
        if (this.rules.decorate) this.rules.decorate(this.g, el, c, p.pile);
        el.setAttribute('aria-label', card.up ? this.rules.cardName(this.g, c) : 'face-down card');
      }
      for (const [pile, s] of Object.entries(this.slots)) s.classList.toggle('empty', !this.g.p[pile].length);
      this.pos = pos;
      if (instant) {
        void this.el.offsetWidth; // apply the new positions without transitions before re-enabling them
        this.el.classList.remove('instant');
      }
    }

    // ---------- Input ----------

    onDown(e) {
      if (!this.g || this.locked || this.down || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const cardEl = e.target.closest('.card');
      const slotEl = e.target.closest('.slot');
      let pile;
      let index = -1;
      if (cardEl) {
        const p = this.pos.get(+cardEl.dataset.id);
        if (!p || p.gone) return;
        pile = p.pile;
        index = p.index;
      } else if (slotEl) pile = slotEl.dataset.pile;
      else return;
      e.preventDefault();
      const d = { pile, index, x: e.clientX, y: e.clientY, id: e.pointerId, drag: false, dx: 0, dy: 0 };
      if (pile !== 'stock' && index >= 0 && this.rules.canPickUp(this.g, pile, index)) {
        d.can = true;
        d.cards = this.g.p[pile].slice(index);
      }
      this.down = d;
      try {
        this.el.setPointerCapture(e.pointerId);
      } catch (err) { /* ignore */ }
    }

    onMove(e) {
      const d = this.down;
      if (!d || e.pointerId !== d.id) return;
      d.dx = e.clientX - d.x;
      d.dy = e.clientY - d.y;
      if (!d.drag) {
        if (!d.can || Math.hypot(d.dx, d.dy) < 6) return;
        d.drag = true;
        d.els = d.cards.map((c) => this.cards.get(c.id));
        d.orig = d.cards.map((c) => this.pos.get(c.id));
        d.els.forEach((el, i) => {
          clearTimeout(el._zt);
          el.classList.add('dragging');
          el.style.zIndex = 1000 + i;
        });
        this.hooks.pick && this.hooks.pick();
      }
      d.els.forEach((el, i) => {
        el.style.transform = `translate(${d.orig[i].x + d.dx}px, ${d.orig[i].y + d.dy}px)`;
      });
      if (!this.raf) {
        this.raf = requestAnimationFrame(() => {
          this.raf = 0;
          if (this.down && this.down.drag) this.markTarget(this.findTarget(this.down));
        });
      }
    }

    onUp(e) {
      const d = this.down;
      if (!d || e.pointerId !== d.id) return;
      this.down = null;
      this.markTarget(null);
      if (d.drag) {
        d.els.forEach((el) => el.classList.remove('dragging'));
        const to = this.findTarget(d);
        if (to) this.hooks.move(d.pile, d.index, to);
        else this.render();
        return;
      }
      if (d.pile === 'stock') this.hooks.draw();
      else if (d.index >= 0) this.hooks.tap(d.pile, d.index);
    }

    cancel() {
      const d = this.down;
      if (!d) return;
      this.down = null;
      this.markTarget(null);
      if (d.drag) {
        d.els.forEach((el) => el.classList.remove('dragging'));
        this.render();
      }
    }

    // The legal pile that the dragged cards overlap the most.
    findTarget(d) {
      const { cw, ch, slots } = this.geo;
      const x = d.orig[0].x + d.dx;
      const y = d.orig[0].y + d.dy;
      let best = null;
      let bestArea = 0;
      for (const [pile, sl] of Object.entries(slots)) {
        if (pile === d.pile || sl.type === 'gone' || pile === 'stock' || pile === 'waste') continue;
        if (!this.rules.canDrop(this.g, d.pile, d.index, pile)) continue;
        const cards = this.g.p[pile];
        let rx = sl.x;
        let ry = sl.y;
        let rh = ch;
        if (cards.length) {
          const t = this.pos.get(cards[cards.length - 1].id);
          if (sl.type === 'fan') rh = t.y - sl.y + ch;
          else {
            rx = t.x;
            ry = t.y;
          }
        }
        const ix = Math.min(x + cw, rx + cw) - Math.max(x, rx);
        const iy = Math.min(y + ch, ry + rh) - Math.max(y, ry);
        if (ix <= 0 || iy <= 0) continue;
        if (ix * iy > bestArea) {
          bestArea = ix * iy;
          best = pile;
        }
      }
      return best;
    }

    markTarget(pile) {
      if (this.marked) this.marked.classList.remove('drop');
      this.marked = pile ? this.topEl(pile) : null;
      if (this.marked) this.marked.classList.add('drop');
    }

    // ---------- Helpers ----------

    topEl(pile) {
      const cards = this.g.p[pile];
      if (cards && cards.length && this.geo.slots[pile].type !== 'catf') return this.cards.get(cards[cards.length - 1].id);
      if (cards && cards.length) {
        const cat = cards.find((c) => this.g.deck[c.id].kind === 'cat');
        if (cat) return this.cards.get(cat.id);
      }
      return this.slots[pile] || null;
    }

    anim(el, cls, ms) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      clearTimeout(el['_' + cls]);
      el['_' + cls] = setTimeout(() => el.classList.remove(cls), ms);
    }

    shake(pile, index) {
      this.g.p[pile].slice(index).forEach((c) => this.anim(this.cards.get(c.id), 'shake', 340));
    }

    flash(pile, index) {
      const els = index == null || index < 0 ? [this.topEl(pile)] : this.g.p[pile].slice(index).map((c) => this.cards.get(c.id));
      els.filter(Boolean).forEach((el) => this.anim(el, 'hint', 1500));
    }

    // Centre of a pile in page coordinates (for effects).
    pileCenter(pile) {
      const r = this.el.getBoundingClientRect();
      const sl = this.geo.slots[pile];
      return { x: r.left + sl.x + this.geo.cw / 2, y: r.top + sl.y + this.geo.ch / 2 };
    }

    pileRect(pile) {
      const r = this.el.getBoundingClientRect();
      const sl = this.geo.slots[pile];
      return { x: r.left + sl.x, y: r.top + sl.y, w: this.geo.cw, h: this.geo.ch };
    }
  }

  S.Board = Board;
})();
