// Hero backdrop: slow-drifting contour lines over a warped noise field.
// `tint` carries the theme's ink colour; only opacity varies.
import { fbmSimplex3d } from "@vgpu/wgsl-std/noise/simplex";

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
  // feathers on a fixed margin.
  fadeX: vec2f,
  fadeY: vec2f,
  fadeTop: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

// Two decorrelated fbm samples displace the domain, so the contours bend
// instead of marching in straight bands.
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

  // Iso-lines, antialiased against the field's screen-space derivative so the
  // line weight stays hairline at any DPR.
  let bands = field * 4.0;
  let dist = abs(fract(bands) - 0.5);
  let aa = max(fwidth(bands), 1e-4);
  let line = 1.0 - smoothstep(0.0, aa * 1.4, dist);

  // The title sits top-left, so the field builds to the right and dies away
  // on every edge, leaving no visible canvas rectangle.
  let horizontal = smoothstep(params.fadeX.x, params.fadeX.y, uv.x)
    * (1.0 - smoothstep(0.92, 1.0, uv.x));
  let vertical = smoothstep(0.0, params.fadeTop, uv.y)
    * (1.0 - smoothstep(params.fadeY.x, params.fadeY.y, uv.y));
  let glow = 0.35 + 0.65 * smoothstep(-0.5, 0.9, field);

  let alpha = line * glow * horizontal * vertical * params.intensity;
  return vec4f(params.tint * alpha, alpha); // premultiplied — matches the canvas alphaMode
}
