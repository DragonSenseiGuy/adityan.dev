// Shared JSX build step: bundles page modules with esbuild, runs them in this
// process, and writes the rendered HTML. Nothing here ships to the browser.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { render } from '../src/jsx.js';

const shimPath = (file) => fileURLToPath(new URL(file, import.meta.url));

// The HTML factory is the default; OG cards compile against satori's instead.
export const HTML_SHIM = shimPath('../src/jsx-shim.js');
export const OG_SHIM = shimPath('../src/og/jsx-shim.js');

// Bundles each entry and returns its exported module namespace, in order.
export async function loadModules(entries, { shim = HTML_SHIM } = {}) {
  const outdir = mkdtempSync(join(tmpdir(), 'adityan-build-'));
  try {
    const { metafile } = await build({
      entryPoints: entries,
      outdir,
      bundle: true,
      format: 'esm',
      platform: 'node',
      outExtension: { '.js': '.mjs' },
      metafile: true,
      jsx: 'transform',
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      inject: [shim],
    });
    const built = new Map(
      Object.entries(metafile.outputs).map(([out, meta]) => [resolve(meta.entryPoint), resolve(out)])
    );
    return await Promise.all(
      entries.map((entry) => import(pathToFileURL(built.get(resolve(entry))).href))
    );
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
}

export { render };
