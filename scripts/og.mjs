// Renders the social cards to PNG at build time: satori lays the JSX out to
// SVG, resvg rasterises it. No image service, no runtime.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg, file) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));

const FONTS = [
  { name: 'Geist', weight: 400, style: 'normal', data: font('geist-sans', 'geist-sans-latin-400-normal.woff') },
  { name: 'Geist', weight: 600, style: 'normal', data: font('geist-sans', 'geist-sans-latin-600-normal.woff') },
  { name: 'Geist Mono', weight: 400, style: 'normal', data: font('geist-mono', 'geist-mono-latin-400-normal.woff') },
];

export async function renderCard(element) {
  const svg = await satori(element, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
