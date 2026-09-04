// Builds the whole site into dist/: pages, blog posts, sitemap, feed, and the
// static assets that are served as-is. Everything in dist/ is generated.
//   node scripts/build.mjs
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildShaders } from './build-shaders.mjs';
import { loadModules, render, OG_SHIM } from './render.mjs';
import { renderCard } from './og.mjs';
import { loadCardImage } from './image.mjs';
import { robots, rss, sitemap } from './feeds.mjs';
import { nginxConf } from './redirects.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');

const ASSETS = ['styles.css', 'script.js'];

const write = (file, contents) => {
  mkdirSync(dirname(join(dist, file)), { recursive: true });
  writeFileSync(join(dist, file), contents);
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const pageEntries = readdirSync(join(root, 'src/pages'))
  .filter((file) => file.endsWith('.jsx'))
  .map((file) => join(root, 'src/pages', file));

const postEntry = join(root, 'src/components/post.jsx');
const cardEntry = join(root, 'src/og/card.jsx');
// post.jsx rides along with the pages so both share one esbuild run.
const [modules, cardModules] = await Promise.all([
  loadModules([...pageEntries, postEntry]),
  loadModules([cardEntry], { shim: OG_SHIM }),
]);
const { PostPage, postOg } = modules.get(postEntry);
const { OgCard } = cardModules.get(cardEntry);
const { posts } = await import('../src/data/posts.js');
const { site, url, fileFor, navLinks } = await import('../src/data/site.js');

const pages = pageEntries.map((entry) => modules.get(entry));
for (const page of pages) write(fileFor(page.path), render(page.element));
for (const post of posts) write(`blog/${post.slug}.html`, render(PostPage({ post })));

// Social cards: one per page and per post, named after the page they belong to.
// A post that points `ogImage` at its own artwork is skipped — it is telling us
// it does not want a generated card.
const postCards = await Promise.all(
  posts
    .filter((post) => !post.ogImage)
    .map(async (post) => ({
      file: `blog/${post.slug}.html`,
      og: postOg(post, await loadCardImage(post.image, { root })),
    }))
);
const pageCards = pages.map(({ path, og }) => ({ file: fileFor(path), og }));
const cards = [...pageCards, ...postCards];
for (const { file, og } of cards) {
  write(`og/${file.replace(/\.html$/, '.png')}`, await renderCard(OgCard(og)));
}

// The sitemap is whatever the page modules say they are: every page that did
// not ask for noindex, listed in nav order. Adding a page adds it here.
const NAV_ORDER = ['/', ...navLinks.map((link) => link.href)];
const rank = (path) => (NAV_ORDER.indexOf(path) + 1 || NAV_ORDER.length + 1);
const blogLastmod = posts[0]?.date.slice(0, 10);
write(
  'sitemap.xml',
  sitemap({
    pages: pages
      .filter((page) => !page.noindex)
      .sort((a, b) => rank(a.path) - rank(b.path))
      .map((page) => ({ loc: url(page.path), lastmod: page.path === '/blog' ? blogLastmod : null })),
    posts,
  })
);
write('feed.xml', rss({ site, posts }));
write('robots.txt', robots({ site }));

for (const asset of ASSETS) cpSync(join(root, asset), join(dist, asset));

// Outside dist/, so it is never served as a static file. The Dockerfile copies
// it out of the build stage into /etc/nginx/snippets/.
writeFileSync(join(root, 'nginx-redirects.conf'), nginxConf());

await buildShaders({ outfile: join(dist, 'hero-canvas.js') });

console.log(`Built ${pages.length} pages, ${posts.length} posts, ${cards.length} social cards -> dist/`);
