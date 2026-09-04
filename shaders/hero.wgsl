// Hero backdrop: slow-drifting contour lines over a warped noise field.
// `tint` carries the theme's ink colour; only opacity varies.
//
// src/og/field.js is the same field rasterised in JS for the social cards. The
// constants both rasterisers share live in src/field-constants.js; the values
// written below are only the checked-in defaults, and scripts/build-shaders.mjs
// overwrites every `// @inject` line from that module before compiling.
import { fbmSimplex3d } from "@vgpu/wgsl-std/noise/simplex";

const FBM_OCTAVES: i32 = 3;                             // @inject fbmOctaves
const FBM_LACUNARITY: f32 = 2.17;                       // @inject fbmLacunarity
const FBM_GAIN: f32 = 0.5;                              // @inject fbmGain
const WARP_STRENGTH: f32 = 0.6;                         // @inject warpStrength
const WARP_OFFSET: vec3f = vec3f(37.2, -19.4, 11.7);    // @inject warpOffset
const WARP_TIME: f32 = 0.05;                            // @inject warpTimeScale
const FIELD_TIME: f32 = 0.03;                           // @inject fieldTimeScale
const BANDS: f32 = 4.0;                                 // @inject bands
const GLOW_BASE: f32 = 0.35;                            // @inject glowBase
const GLOW_RANGE: f32 = 0.65;                           // @inject glowRange
const GLOW_EDGES: vec2f = vec2f(-0.5, 0.9);             // @inject glowEdges
const FADE_RIGHT: vec2f = vec2f(0.92, 1.0);             // @inject fadeRight

struct Params {
  resolution: vec2f,
  time: f32,
  intensity: f32,
  tint: vec3f,
  // Height of the sampled field window, in field units. Derived by the host
  // from the canvas height so contours are the same pixel size on every hero.
  scale: f32,
  // Envelope, in uv space: fadeX ramps in from the left, fadeY falls off
  // toward the bottom, fadeTop feathers below the top edge. The right edge
  // feathers on FADE_RIGHT.
  fadeX: vec2f,
  fadeY: vec2f,
  fadeTop: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

// Two decorrelated fbm samples displace the domain, so the contours bend
// instead of marching in straight bands.
fn warpedField(position: vec2f, time: f32) -> f32 {
  let drift = vec3f(position, time * WARP_TIME);
  let warp = vec2f(
    fbmSimplex3d(drift, FBM_OCTAVES, FBM_LACUNARITY, FBM_GAIN),
    fbmSimplex3d(drift + WARP_OFFSET, FBM_OCTAVES, FBM_LACUNARITY, FBM_GAIN),
  );
  return fbmSimplex3d(
    vec3f(position + warp * WARP_STRENGTH, time * FIELD_TIME),
    FBM_OCTAVES, FBM_LACUNARITY, FBM_GAIN,
  );
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.resolution.x / max(params.resolution.y, 1.0);
  let p = vec2f((uv.x - 0.5) * aspect, uv.y - 0.5) * params.scale;

  let field = warpedField(p, params.time);

  // Iso-lines, antialiased against the field's screen-space derivative so the
  // line weight stays hairline at any DPR.
  let bands = field * BANDS;
  let dist = abs(fract(bands) - 0.5);
  let aa = max(fwidth(bands), 1e-4);
  let line = 1.0 - smoothstep(0.0, aa * 1.4, dist);

  // The title sits top-left, so the field builds to the right and dies away
  // on every edge, leaving no visible canvas rectangle.
  let horizontal = smoothstep(params.fadeX.x, params.fadeX.y, uv.x)
    * (1.0 - smoothstep(FADE_RIGHT.x, FADE_RIGHT.y, uv.x));
  let vertical = smoothstep(0.0, params.fadeTop, uv.y)
    * (1.0 - smoothstep(params.fadeY.x, params.fadeY.y, uv.y));
  let glow = GLOW_BASE + GLOW_RANGE * smoothstep(GLOW_EDGES.x, GLOW_EDGES.y, field);

  let alpha = line * glow * horizontal * vertical * params.intensity;
  return vec4f(params.tint * alpha, alpha); // premultiplied — matches the canvas alphaMode
}
