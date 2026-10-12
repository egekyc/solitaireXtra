# SolitaireXtra

A pixel-art solitaire collection for phone and web, with four games:

| Game | How it works |
|---|---|
| **Classic** | Klondike. Draw 1 or Draw 3, Windows-style scoring, auto-finish and the bouncing-cards win animation. |
| **Countries** | Category solitaire. Sort countries under their continent: Europe, Asia, Africa, North America, South America and Oceania. |
| **Games** | Category solitaire. Match characters to their video game. |
| **TV & Movies** | Category solitaire. Match characters to their TV show or movie. Play both, or only TV or only Movies. |

## Category solitaire rules

Each set has one coloured **category card** (a continent, a game, a show or a movie) and some **word cards** (countries or characters).

- Put a category card on an empty slot at the top, then add every word that belongs to it. A full set clears and frees its slot.
- In the columns, a word can go on a word or category card of the same set. Any card can go into an empty column.
- The number on a category card shows how many words it needs.
- Every move and every draw uses up one move. Run out and the game is over, but you can undo or replay the deal.


On Countries, Easy uses only well-known countries and Hard uses all of them. Each card has one right answer: countries that span two continents (Russia, Turkey, Egypt, Kazakhstan…) are left out.


## Controls

- Drag cards, or tap a card to send it to the best spot (you can turn this off in Settings).
- Tap the deck to draw. When the deck is empty, tap it to turn the waste pile back over.
- Keyboard: `Space` draw, `U` or `Ctrl+Z` undo, `H` hint, `Esc` menu.
- Settings: sound, tap to move, move limit, table colour and card back.



## Project layout

```
index.html                 screens: home, game, dialogs
css/style.css              all styling (mobile-first, pixel look)
js/util.js                 seeded random numbers, storage, chiptune sound effects
js/pixel.js                pixel-art sprites (suits, court cards, icons) as SVG and canvas
js/klondike.js             classic rules, hints, auto-finish, layout
js/category.js             category rules, deal solver, hints, layout
js/board.js                card rendering, drag and drop, tap to move, animations
js/fx.js                   particle bursts and the win cascade
js/app.js                  game flow, saving, stats, settings
js/data/geo.js             countries by continent
js/data/fandom.js          characters by franchise
tools/selftest.mjs         checks the data and the solver (npm test)
tools/make-icons.py        generates the app icons
tools/build-www.mjs        copies the app into www/ for Capacitor
sw.js, manifest.webmanifest  offline support and installable app
```


## Credits & license

- Code: MIT, see [LICENSE](LICENSE).
- All art is drawn in code as pixel grids (`js/pixel.js`). No image files are used apart from the app icons, which `tools/make-icons.py` generates.
- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (SIL Open Font License).
- Character and franchise names are trademarks of their owners. They are used only as trivia, and this project is not affiliated with or endorsed by any of them.
