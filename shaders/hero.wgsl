// Hero backdrop: slow-drifting contour lines over a warped noise field.
// Monochrome by construction — `tint` carries the theme's ink colour and the
// shader only ever varies its opacity, so it reads the same in both themes.
import { fbmSimplex3d } from "@vgpu/wgsl-std/noise/simplex";

struct Params {
  resolution: vec2f,
  time: f32,
  intensity: f32,
  tint: vec3f,
  // Height of the sampled field window, in field units. The host derives it
  // from the canvas height so a contour is the same size in pixels on every
  // hero, however tall that hero is.
  scale: f32,
  // Envelope, in uv space: fadeX is the (start, end) of the ramp in from the
  // left, fadeY the (start, end) of the fall-off toward the bottom, fadeTop
  // the feather below the top edge. Every hero picks its own, so the field
  // always dies away before it reaches the copy, whatever shape that hero is.
  // The right edge feathers on a fixed margin — that is the canvas running
  // out, not a design decision.
  fadeX: vec2f,
  fadeY: vec2f,
  fadeTop: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

// Two decorrelated fbm samples (offsets >= 2 units apart) displacing the
// domain, so the contours bend instead of marching in straight bands.
fn warpedField(position: vec2f, time: f32) -> f32 {
  let drift = vec3f(position, time * 0.05);
  let warp = vec2f(
    fbmSimplex3d(drift, 3, 2.17, 0.5),
    fbmSimplex3d(drift + vec3f(37.2, -19.4, 11.7), 3, 2.17, 0.5),
  );
  return fbmSimplex3d(vec3f(position + warp * 0.6, time * 0.03), 3, 2.17, 0.5);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.resolution.x / max(params.resolution.y, 1.0);
  let p = vec2f((uv.x - 0.5) * aspect, uv.y - 0.5) * params.scale;

  let field = warpedField(p, params.time);

  // Iso-lines of the field, antialiased against the field's own screen-space
  // derivative so line weight stays hairline at any DPR.
  let bands = field * 4.0;
  let dist = abs(fract(bands) - 0.5);
  let aa = max(fwidth(bands), 1e-4);
  let line = 1.0 - smoothstep(0.0, aa * 1.4, dist);

  // The title sits top-left, so the field builds up to the right and dies
  // away on every edge — no visible canvas rectangle anywhere.
  let horizontal = smoothstep(params.fadeX.x, params.fadeX.y, uv.x)
    * (1.0 - smoothstep(0.92, 1.0, uv.x));
  let vertical = smoothstep(0.0, params.fadeTop, uv.y)
    * (1.0 - smoothstep(params.fadeY.x, params.fadeY.y, uv.y));
  let glow = 0.35 + 0.65 * smoothstep(-0.5, 0.9, field);

  let alpha = line * glow * horizontal * vertical * params.intensity;
  return vec4f(params.tint * alpha, alpha); // premultiplied — matches the canvas alphaMode
}
