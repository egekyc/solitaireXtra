// Copies the web app into www/ for Capacitor (which bundles webDir into the Android/iOS app).
//   node tools/build-www.mjs
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const item of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons']) {
  cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('Copied app to', out);
