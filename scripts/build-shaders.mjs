// Flattens the WGSL import graph and bundles the browser entry, so the site
// keeps shipping as plain static files with no loader at runtime.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { resolveShader } from "@vgpu/wgsl/runtime";
import { FIELD } from "../src/field-constants.js";

const root = new URL("../", import.meta.url);

// A `const NAME: TYPE = <value>; // @inject key` line in the WGSL takes its
// value from FIELD[key], so the shader and src/og/field.js cannot disagree
// about the field they are both drawing. The literal in the source is only a
// default that keeps the file valid WGSL on its own.
const INJECT = /(const\s+\S+\s*:\s*(\S+)\s*=\s*)([^;]+)(;\s*\/\/\s*@inject\s+(\w+))/g;

// f32 literals need a decimal point; WGSL will not widen an integer literal.
const number = (value) => (Number.isInteger(value) ? `${value}.0` : String(value));

const wgslLiteral = (type, value) => {
  if (Array.isArray(value)) return `${type}(${value.map(number).join(", ")})`;
  if (type === "i32" || type === "u32") return String(Math.trunc(value));
  return number(value);
};

function injectConstants(wgsl) {
  let injected = 0;
  const out = wgsl.replace(INJECT, (_match, head, type, _value, tail, key) => {
    if (!(key in FIELD)) throw new Error(`hero.wgsl: @inject ${key} is not in src/field-constants.js`);
    injected++;
    return `${head}${wgslLiteral(type, FIELD[key])}${tail}`;
  });
  // Every key has to land somewhere, or a constant is silently only defined in
  // JS and the two rasterisers drift again.
  const missing = Object.keys(FIELD).filter((key) => !new RegExp(`@inject ${key}\\b`).test(wgsl));
  if (missing.length) throw new Error(`hero.wgsl: no @inject line for ${missing.join(", ")}`);
  if (injected !== Object.keys(FIELD).length) {
    throw new Error(`hero.wgsl: injected ${injected} constants, expected ${Object.keys(FIELD).length}`);
  }
  return out;
}

export async function buildShaders({ outfile }) {
  const generated = fileURLToPath(new URL("src/hero.generated.wgsl", root));
  const resolved = await resolveShader({
    entry: fileURLToPath(new URL("shaders/hero.wgsl", root)),
  });
  writeFileSync(generated, injectConstants(resolved.wgsl));

  const result = await build({
    entryPoints: [fileURLToPath(new URL("src/hero-canvas.js", root))],
    outfile,
    bundle: true,
    minify: true,
    format: "esm",
    target: "es2022",
    loader: { ".wgsl": "text" },
    metafile: true,
  });

  const [, out] = Object.entries(result.metafile.outputs)[0];
  console.log(`hero-canvas.js  ${(out.bytes / 1024).toFixed(1)} kB  (${resolved.deps.length} wgsl deps)`);
}
