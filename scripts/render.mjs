// Shared JSX build step: bundles page modules with esbuild, runs them in this
// process, and writes the rendered HTML. Nothing here ships to the browser.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { render } from '../src/jsx.js';

const shimPath = (file) => fileURLToPath(new URL(file, import.meta.url));

// The HTML factory is the default; OG cards compile against satori's instead.
export const HTML_SHIM = shimPath('../src/jsx-shim.js');
export const OG_SHIM = shimPath('../src/og/jsx-shim.js');

// src/data/ is plain JS with no JSX, and it locates its own content on disk
// relative to import.meta.url — which a bundle written to a temp dir would get
// wrong. Leaving it external keeps that resolution honest, and means the build
// and the pages share one instance instead of parsing the posts twice.
const externalData = {
  name: 'external-data',
  setup(build) {
    build.onResolve({ filter: /(^|\/)data\/[\w-]+\.js$/ }, (args) => {
      if (args.kind === 'entry-point') return null;
      const target = resolve(args.resolveDir, args.path);
      if (!target.includes(`${sep}src${sep}data${sep}`)) return null;
      return { path: pathToFileURL(target).href, external: true };
    });
  },
};

// Bundles each entry and returns a Map from entry path to its module namespace.
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
      plugins: [externalData],
    });
    const built = new Map(
      Object.entries(metafile.outputs).map(([out, meta]) => [resolve(meta.entryPoint), resolve(out)])
    );
    const loaded = await Promise.all(
      entries.map((entry) => import(pathToFileURL(built.get(resolve(entry))).href))
    );
    return new Map(entries.map((entry, index) => [entry, loaded[index]]));
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
}

export { render };
