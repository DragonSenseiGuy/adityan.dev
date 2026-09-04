// The numbers that define the contour field, in one place.
//
// The field is rasterised twice: shaders/hero.wgsl draws it live on the site,
// src/og/field.js draws a still frame of it into the social cards. They have to
// look like the same field, so neither owns these values. scripts/build-shaders
// injects them into the WGSL's `// @inject` constants before it compiles, so a
// change here reaches both rasterisers.
export const FIELD = {
  // fbm: three octaves, non-integer lacunarity so the octaves stay decorrelated.
  fbmOctaves: 3,
  fbmLacunarity: 2.17,
  fbmGain: 0.5,
  // Domain warp: how far the two decorrelated fbm samples displace the domain,
  // and the offset that decorrelates the second sample from the first.
  warpStrength: 0.6,
  warpOffset: [37.2, -19.4, 11.7],
  // Drift rates: the warp moves faster than the field it displaces.
  warpTimeScale: 0.05,
  fieldTimeScale: 0.03,
  // Iso-lines per field unit.
  bands: 4,
  // Line brightness across the field's range: lines in a trough stay visible,
  // lines on a crest glow.
  glowBase: 0.35,
  glowRange: 0.65,
  glowEdges: [-0.5, 0.9],
  // Where the field feathers out against the right edge, in uv. The cards
  // override this for the narrow layout; the site uses it as-is.
  fadeRight: [0.92, 1.0],
};
