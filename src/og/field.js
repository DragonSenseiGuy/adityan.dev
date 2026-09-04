// A still frame of the hero backdrop, drawn as SVG so the social cards carry
// the same contour field as the site. This is shaders/hero.wgsl rewritten in
// JS: the same warped fbm, the same iso-lines, the same edge envelope — only
// the rasteriser differs, because satori cannot run WebGPU.

// Deterministic permutation table, so a given seed always draws the same field.
function permutation(seed) {
  let state = (seed >>> 0) || 1;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return Uint8Array.from([...perm, ...perm]);
}

const GRAD = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

const F3 = 1 / 3;
const G3 = 1 / 6;

// Textbook 3D simplex noise, roughly in [-1, 1].
function simplex3d(perm, x, y, z) {
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const z0 = z - (k - t);

  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
    else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
    else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
  } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
  else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
  else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];

  const corners = [
    [x0, y0, z0, 0, 0, 0],
    [x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, i1, j1, k1],
    [x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, i2, j2, k2],
    [x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3, 1, 1, 1],
  ];

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  let total = 0;
  for (const [cx, cy, cz, oi, oj, ok] of corners) {
    let falloff = 0.6 - cx * cx - cy * cy - cz * cz;
    if (falloff <= 0) continue;
    const g = GRAD[perm[ii + oi + perm[jj + oj + perm[kk + ok]]] % 12];
    falloff *= falloff;
    total += falloff * falloff * (g[0] * cx + g[1] * cy + g[2] * cz);
  }
  return 32 * total;
}

function fbm(perm, x, y, z, octaves = 3, lacunarity = 2.17, gain = 0.5) {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amplitude * simplex3d(perm, x * frequency, y * frequency, z * frequency);
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return sum;
}

// Two decorrelated fbm samples displace the domain, so the contours bend
// instead of marching in straight bands. Mirrors warpedField() in the WGSL.
function warpedField(perm, x, y, time) {
  const wx = fbm(perm, x, y, time * 0.05);
  const wy = fbm(perm, x + 37.2, y - 19.4, time * 0.05 + 11.7);
  return fbm(perm, x + wx * 0.6, y + wy * 0.6, time * 0.03);
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (edge0, edge1, v) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// The 16 marching-squares cases, as the pairs of cell edges a contour crosses.
// Edges: 0 top, 1 right, 2 bottom, 3 left.
const CASES = [
  [], [[3, 2]], [[2, 1]], [[3, 1]],
  [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]],
  [[3, 0]], [[0, 2]], [[3, 2], [0, 1]], [[0, 1]],
  [[3, 1]], [[2, 1]], [[3, 2]], [],
];

/**
 * Renders the field to an SVG string.
 *
 * `fadeX`, `fadeRight`, `fadeY` and `fadeTop` are the shader's envelope
 * uniforms in uv space: fadeX ramps the field in from the left, fadeRight
 * takes it back out, fadeY drops it off toward the bottom, and fadeTop
 * feathers it below the top edge.
 */
export function contourField({
  width = 1200,
  height = 630,
  seed = 1,
  time = 0,
  step = 5,
  scale = 3.2,
  tint = '#ededed',
  intensity = 0.5,
  fadeX = [0.1, 0.72],
  fadeRight = [0.92, 1.0],
  fadeY = [0.68, 1.0],
  fadeTop = 0.22,
} = {}) {
  const perm = permutation(seed);
  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  const aspect = width / height;

  // Sample the field once per grid vertex; marching squares reads it 4x.
  const values = new Float32Array((cols + 1) * (rows + 1));
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const u = (col * step) / width;
      const v = (row * step) / height;
      const px = (u - 0.5) * aspect * scale;
      const py = (v - 0.5) * scale;
      values[row * (cols + 1) + col] = warpedField(perm, px, py, time);
    }
  }

  // Contours sit where the field crosses a quarter step, matching the WGSL's
  // `fract(field * 4.0)` bands.
  const levels = [];
  for (let level = -1; level <= 1.0001; level += 0.25) levels.push(Number(level.toFixed(3)));

  // Line opacity varies across the card exactly as the shader's alpha does.
  // Quantising it into a few buckets keeps this to a handful of <path>s.
  const BUCKETS = 6;
  const buckets = Array.from({ length: BUCKETS }, () => []);

  const at = (col, row) => values[row * (cols + 1) + col];
  const crossing = (edge, col, row, level) => {
    const a = at(col, row);
    const b = at(col + 1, row);
    const c = at(col + 1, row + 1);
    const d = at(col, row + 1);
    const mix = (p, q) => (level - p) / (q - p || 1e-6);
    if (edge === 0) return [(col + mix(a, b)) * step, row * step];
    if (edge === 1) return [(col + 1) * step, (row + mix(b, c)) * step];
    if (edge === 2) return [(col + mix(d, c)) * step, (row + 1) * step];
    return [col * step, (row + mix(a, d)) * step];
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = at(col, row);
      const b = at(col + 1, row);
      const c = at(col + 1, row + 1);
      const d = at(col, row + 1);
      const lo = Math.min(a, b, c, d);
      const hi = Math.max(a, b, c, d);
      for (const level of levels) {
        if (level < lo || level > hi) continue;
        const index = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        for (const [from, to] of CASES[index]) {
          const [x1, y1] = crossing(from, col, row, level);
          const [x2, y2] = crossing(to, col, row, level);
          const u = (x1 + x2) / 2 / width;
          const v = (y1 + y2) / 2 / height;
          const horizontal = smoothstep(fadeX[0], fadeX[1], u) * (1 - smoothstep(fadeRight[0], fadeRight[1], u));
          const vertical = smoothstep(0, fadeTop, v) * (1 - smoothstep(fadeY[0], fadeY[1], v));
          const glow = 0.35 + 0.65 * smoothstep(-0.5, 0.9, level);
          const alpha = horizontal * vertical * glow * intensity;
          if (alpha < 0.02) continue;
          const bucket = Math.min(BUCKETS - 1, Math.floor(alpha * BUCKETS));
          buckets[bucket].push(
            `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`
          );
        }
      }
    }
  }

  const paths = buckets
    .map((segments, i) =>
      segments.length
        ? `<path d="${segments.join('')}" stroke="${tint}" stroke-opacity="${(((i + 0.5) / BUCKETS)).toFixed(3)}" stroke-width="1.1" fill="none"/>`
        : ''
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths}</svg>`;
}

export const fieldDataUri = (options) =>
  `data:image/svg+xml;base64,${Buffer.from(contourField(options)).toString('base64')}`;

// A stable seed per card, so every page keeps its own frame of the field.
export const seedFrom = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
