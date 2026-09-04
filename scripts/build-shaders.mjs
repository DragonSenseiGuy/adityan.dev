// Flattens the WGSL import graph and bundles the browser entry, so the site
// keeps shipping as plain static files with no loader at runtime.
//   node scripts/build-shaders.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { resolveShader } from "@vgpu/wgsl/runtime";

const root = new URL("../", import.meta.url);
const generated = fileURLToPath(new URL("src/hero.generated.wgsl", root));

const resolved = await resolveShader({
  entry: fileURLToPath(new URL("shaders/hero.wgsl", root)),
});
writeFileSync(generated, resolved.wgsl);

const result = await build({
  entryPoints: [fileURLToPath(new URL("src/hero-canvas.js", root))],
  outfile: fileURLToPath(new URL("hero-canvas.js", root)),
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  loader: { ".wgsl": "text" },
  metafile: true,
});

const [, out] = Object.entries(result.metafile.outputs)[0];
console.log(`hero-canvas.js  ${(out.bytes / 1024).toFixed(1)} kB  (${resolved.deps.length} wgsl deps)`);
