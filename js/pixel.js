// Pixel-art sprites. Every sprite is a grid of characters; each character maps to a colour
// and '.' is transparent. Grids are turned into crisp SVG (for the page) or canvas pixels (for effects).
(function () {
  const S = (globalThis.Sol = globalThis.Sol || {});

  const C = {
    red: '#d63c3c',
    black: '#2a2840',
    navy: '#3b4a8c',
    gold: '#f2c230',
    skin: '#f2c08f',
    hair: '#7a4a26',
    beard: '#e8e2d0',
    cream: '#f7f1e3',
    leaf: '#4cbf6b',
  };

  const G = {
    // Suits: 0 spades, 1 hearts, 2 diamonds, 3 clubs.
    suit0: [
      '....X....',
      '...XXX...',
      '..XXXXX..',
      '.XXXXXXX.',
      'XXXXXXXXX',
      'XXXXXXXXX',
      '.XX.X.XX.',
      '....X....',
      '...XXX...',
    ],
    suit1: [
      '.XX...XX.',
      'XXXX.XXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      '.XXXXXXX.',
      '..XXXXX..',
      '...XXX...',
      '....X....',
    ],
    suit2: [
      '....X....',
      '...XXX...',
      '..XXXXX..',
      '.XXXXXXX.',
      'XXXXXXXXX',
      '.XXXXXXX.',
      '..XXXXX..',
      '...XXX...',
      '....X....',
    ],
    suit3: [
      '...XXX...',
      '..XXXXX..',
      '..XXXXX..',
      'XXX.X.XXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      '.XX.X.XX.',
      '....X....',
      '..XXXXX..',
    ],

    // Court cards. C is the suit colour.
    jack: [
      '...CCCCC...',
      '..CCCCCCCF.',
      '.CCCCCCCCFF',
      '..HSSSSSH..',
      '..HKSSSKH..',
      '..HSSSSSH..',
      '..HSSRSSH..',
      '...SSSSS...',
      '....SSS....',
      '.CCCCCCCCC.',
      'CCCWCCCWCCC',
      'CCCWCCCWCCC',
      'CCCCCCCCCCC',
    ],
    queen: [
      '...Y.Y.Y...',
      '...YYYYY...',
      '..HHHHHHH..',
      '.HHSSSSSHH.',
      '.HSKSSSKSH.',
      '.HSSSSSSSH.',
      '.HSSSRSSSH.',
      '.HHSSSSSHH.',
      '.HH.SSS.HH.',
      '.CCCCCCCCC.',
      'CCCCYYYCCCC',
      'CCCCCYCCCCC',
      'CCCCCCCCCCC',
    ],
    king: [
      '..Y.Y.Y.Y..',
      '..YYYYYYY..',
      '..YRYYYRY..',
      '..SSSSSSS..',
      '..SKSSSKS..',
      '..SSSSSSS..',
      '..BSSRSSB..',
      '..BBBBBBB..',
      '...BBBBB...',
      '.CCCCCCCCC.',
      'CCCYCCCYCCC',
      'CCCYCCCYCCC',
      'CCCCCCCCCCC',
    ],

    // Category icons (drawn in the card's text colour).
    globe: [
      '...XXXXX...',
      '..X..X..X..',
      '.X..X.X..X.',
      'X..X...X..X',
      'XXXXXXXXXXX',
      'X..X...X..X',
      'X..X...X..X',
      'XXXXXXXXXXX',
      '.X..X.X..X.',
      '..X..X..X..',
      '...XXXXX...',
    ],
    game: [
      '..XXXXXXXXX..',
      '.XXXXXXXXXXX.',
      'XXX.XXXXXX.XX',
      'XX...XXXX.X.X',
      'XXX.XXXXXX.XX',
      'XXXXXXXXXXXXX',
      'XXXX.....XXXX',
      '.XX.......XX.',
    ],
    tv: [
      '..X.....X..',
      '...X...X...',
      '....X.X....',
      'XXXXXXXXXXX',
      'X.........X',
      'X.XX......X',
      'X.X.......X',
      'X.........X',
      'XXXXXXXXXXX',
      '.X.......X.',
    ],
    movie: [
      '.XX..XX..XX',
      'XX..XX..XX.',
      'XXXXXXXXXXX',
      '...........',
      'XXXXXXXXXXX',
      'X.........X',
      'X.XXXX....X',
      'X.........X',
      'X.XXXXXX..X',
      'XXXXXXXXXXX',
    ],

    // Faint decorations at the bottom of word cards.
    flag: [
      'XFFFFF...',
      'XFFFFFFF.',
      'XFFFFFFF.',
      'XFFFF....',
      'X........',
      'X........',
      'X........',
      'XXX......',
    ],
    person: [
      '...XXX...',
      '..XXXXX..',
      '..XXXXX..',
      '...XXX...',
      '.XXXXXXX.',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
    ],

    // Toolbar and menu icons.
    back: ['...X...', '..XX...', '.XXXXXX', 'XXXXXXX', '.XXXXXX', '..XX...', '...X...'],
    undo: ['..X....', '.XX....', 'XXXXXX.', '.XX...X', '..X...X', '......X', '..XXXX.'],
    hint: ['..XXX..', '.X...X.', '.X...X.', '.X...X.', '..X.X..', '..XXX..', '..XXX..'],
    plus: ['...X...', '...X...', '...X...', 'XXXXXXX', '...X...', '...X...', '...X...'],
    bolt: ['....XX.', '...XX..', '..XX...', '.XXXXX.', '...XX..', '..XX...', '.XX....'],
    gear: ['..X.X..', '.XXXXX.', 'XXX.XXX', '.X...X.', 'XXX.XXX', '.XXXXX.', '..X.X..'],
    chart: ['......X', '....X.X', '....X.X', '..X.X.X', '..X.X.X', 'X.X.X.X', 'XXXXXXX'],
    help: ['.XXXXX.', 'XX...XX', '.....XX', '...XXX.', '...XX..', '.......', '...XX..'],
    recycle: ['.XXXX..', 'X....X.', 'X...XXX', 'X....X.', 'X......', 'X....X.', '.XXXX..'],
    star: ['...X...', '...X...', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', 'X.....X'],
  };

  const cache = new Map();

  // Grid -> inline SVG string. Runs of the same colour on a row are merged into one rect.
  function svg(grid, colors, cls = '') {
    const key = grid.join('/') + '|' + JSON.stringify(colors) + '|' + cls;
    if (cache.has(key)) return cache.get(key);
    const h = grid.length;
    const w = Math.max(...grid.map((r) => r.length));
    let rects = '';
    grid.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let run = 1;
        while (row[x + run] === ch) run++;
        if (colors[ch]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${colors[ch]}"/>`;
        x += run;
      }
    });
    const out = `<svg class="px ${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
    cache.set(key, out);
    return out;
  }

  // Grid -> pixels on a canvas, `scale` canvas pixels per grid cell.
  function paint(ctx, grid, colors, x, y, scale) {
    grid.forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) {
        const col = colors[row[gx]];
        if (!col || col === 'currentColor') continue;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + gx * scale), Math.round(y + gy * scale), Math.ceil(scale), Math.ceil(scale));
      }
    });
  }

  const suitColor = (suit) => (suit === 1 || suit === 2 ? C.red : C.black);
  const courtColors = (suit) => ({
    C: suit === 1 || suit === 2 ? C.red : C.navy,
    Y: C.gold,
    R: C.red,
    S: C.skin,
    K: C.black,
    H: C.hair,
    B: C.beard,
    W: C.cream,
    F: C.leaf,
  });

  S.PX = {
    C,
    G,
    svg,
    paint,
    suitColor,
    courtColors,
    suit: (suit, cls) => svg(G['suit' + suit], { X: suitColor(suit) }, cls),
    court: (rank, suit) => svg(G[{ 11: 'jack', 12: 'queen', 13: 'king' }[rank]], courtColors(suit), 'court'),
    icon: (name, color = 'currentColor') => svg(G[name], { X: color, F: color, S: color }, 'icon icon-' + name),

    // Card-back pattern as a CSS url(): a lattice of pixel diamonds.
    backImage(base, line) {
      const px = [
        [3, 0, 2, 1], [2, 1, 1, 1], [5, 1, 1, 1], [1, 2, 1, 1], [6, 2, 1, 1], [0, 3, 1, 2],
        [7, 3, 1, 2], [1, 5, 1, 1], [6, 5, 1, 1], [2, 6, 1, 1], [5, 6, 1, 1], [3, 7, 2, 1],
        [3, 3, 2, 2],
      ];
      const body = px.map(([x, y, w, h]) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${line}'/>`).join('');
      const doc = `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' shape-rendering='crispEdges'><rect width='8' height='8' fill='${base}'/>${body}</svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(doc)}")`;
    },
  };
})();
