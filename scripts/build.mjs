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
import { rss, sitemap } from './feeds.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');

process.env.POSTS_DIR ||= join(root, 'content', 'posts');

const ASSETS = ['styles.css', 'script.js', 'robots.txt'];

// Static pages, in the order they belong in the sitemap.
const PAGE_URLS = [
  'https://adityan.dev/',
  'https://adityan.dev/about',
  'https://adityan.dev/projects',
  'https://adityan.dev/blog',
  'https://adityan.dev/contact',
];

const write = (file, contents) => {
  mkdirSync(dirname(join(dist, file)), { recursive: true });
  writeFileSync(join(dist, file), contents);
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const pageEntries = readdirSync(join(root, 'src/pages'))
  .filter((file) => file.endsWith('.jsx'))
  .map((file) => join(root, 'src/pages', file));

const modules = await loadModules([...pageEntries, join(root, 'src/components/post.jsx')]);
const { PostPage, postOg } = modules.at(-1);
const [{ OgCard }] = await loadModules([join(root, 'src/og/card.jsx')], { shim: OG_SHIM });
const { posts } = await import('../src/data/posts.js');
const { site } = await import('../src/data/site.js');

const pages = modules.slice(0, -1);
for (const { file, element } of pages) write(file, render(element));
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
// A page can name an image in its own `og` export; it is loaded the same way.
const pageCards = await Promise.all(
  pages.map(async ({ file, og }) => ({
    file,
    og: { ...og, image: await loadCardImage(og.image, { root }) },
  }))
);
const cards = [...pageCards, ...postCards];
for (const { file, og } of cards) {
  write(`og/${file.replace(/\.html$/, '.png')}`, await renderCard(OgCard(og)));
}

const blogLastmod = posts[0]?.date.slice(0, 10);
write(
  'sitemap.xml',
  sitemap({
    pages: PAGE_URLS.map((loc) => ({ loc, lastmod: loc.endsWith('/blog') ? blogLastmod : null })),
    posts,
  })
);
write('feed.xml', rss({ site, posts }));

for (const asset of ASSETS) cpSync(join(root, asset), join(dist, asset));

await buildShaders({ outfile: join(dist, 'hero-canvas.js') });

console.log(`Built ${pages.length} pages, ${posts.length} posts, ${cards.length} social cards -> dist/`);
