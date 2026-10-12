// Checks the card data and the deal solver without a browser.
//   node tools/selftest.mjs          (add a number to change how many deals per level are tried)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const f of ['js/util.js', 'js/pixel.js', 'js/data/geo.js', 'js/data/fandom.js', 'js/klondike.js', 'js/category.js']) {
  vm.runInThisContext(readFileSync(path.join(root, f), 'utf8'), { filename: f });
}
const S = globalThis.Sol;
let failed = false;
const fail = (msg) => {
  failed = true;
  console.log('  FAIL', msg);
};

console.log('Data');
const seen = new Map();
for (const f of S.FANDOM) {
  if (f.chars.length < 8) fail(`${f.name} has only ${f.chars.length} characters (Hard needs 7)`);
  for (const c of f.chars) {
    const k = c.toLowerCase();
    if (seen.has(k)) fail(`"${c}" is in both ${seen.get(k)} and ${f.name}`);
    seen.set(k, f.name);
  }
}
for (const m of ['game', 'tv', 'movie']) {
  const n = S.FANDOM.filter((f) => f.medium === m).length;
  if (n < 6) fail(`only ${n} ${m} franchises (Hard needs 6)`);
  console.log(`  ${m}: ${n} franchises`);
}
const countries = new Map();
for (const c of S.GEO) {
  if (c.easy < 5) fail(`${c.name} easy pool is smaller than 5`);
  for (const n of c.countries) {
    if (countries.has(n)) fail(`${n} listed in ${countries.get(n)} and ${c.name}`);
    countries.set(n, c.name);
  }
}
console.log(`  ${S.FANDOM.reduce((a, f) => a + f.chars.length, 0)} characters, ${countries.size} countries`);

console.log('Deals');
const N = Number(process.argv[2]) || 20;
const MODES = [
  ['geo', 'mix'],
  ['games', 'mix'],
  ['screen', 'mix'],
  ['screen', 'tv'],
  ['screen', 'movie'],
];
for (const [kind, pack] of MODES) {
  for (const diff of ['easy', 'normal', 'hard']) {
    let unsolvedFirst = 0;
    let ms = 0;
    let worst = 0;
    const pars = [];
    const budgets = [];
    for (let i = 0; i < N; i++) {
      const seed = 1000 + i * 31;
      const t0 = performance.now();
      if (!S.Category.solve(S.Category.deal({ kind, diff, pack }, seed), 30000)) unsolvedFirst++;
      const g = S.Category.newGame({ kind, diff, pack }, seed);
      const dt = performance.now() - t0;
      ms += dt;
      worst = Math.max(worst, dt);
      const icons = g.cats.map((c) => c.icon);
      const okIcon = (i) => (kind === 'geo' ? i === 'globe' : kind === 'games' ? i === 'game' : i !== 'game' && (pack === 'mix' || i === pack));
      if (!icons.every(okIcon)) fail(`${kind}/${pack}/${diff} seed ${seed}: wrong franchise type in deal (${icons})`);
      pars.push(g.n.par);
      budgets.push(g.n.budget);
      // Replay the solver's solution through the real rules to make sure they agree.
      const sol = S.Category.solve(g, 30000);
      if (!sol) {
        fail(`${kind}/${diff} seed ${seed}: solver could not re-solve its own deal`);
        continue;
      }
      for (const m of sol) {
        const ev = m.draw ? S.Category.draw(g) : S.Category.canDrop(g, m.from, m.index, m.to) && S.Category.applyMove(g, m.from, m.index, m.to);
        if (!ev) {
          fail(`${kind}/${diff} seed ${seed}: illegal solver move ${JSON.stringify(m)}`);
          break;
        }
      }
      if (!S.Category.isWon(g)) fail(`${kind}/${diff} seed ${seed}: solution did not win`);
    }
    const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
    console.log(
      `  ${kind}${pack === 'mix' ? '' : '-' + pack}/${diff}: first deal solvable ${N - unsolvedFirst}/${N}, avg ${Math.round(ms / N)}ms (worst ${Math.round(worst)}ms), ` +
        `par avg ${avg(pars)}, budget avg ${avg(budgets)}`
    );
  }
}

console.log('Classic');
{
  const g = S.Klondike.newGame({ draw: 1 }, 42);
  const ids = new Set(Object.values(g.p).flat().map((c) => c.id));
  if (ids.size !== 52) fail('classic deal does not hold 52 unique cards');
  if (g.p.stock.length !== 24) fail('classic stock should have 24 cards');
  console.log('  deal ok');
}

console.log(failed ? '\nSome checks FAILED' : '\nAll checks passed');
process.exit(failed ? 1 : 0);
