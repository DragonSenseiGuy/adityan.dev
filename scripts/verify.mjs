// Verification for the agent-readiness behaviour: Markdown negotiation, the
// agent-friendly 404, llms.txt, brand keywords, Organization schema, and the
// privacy page. These tests pin the files and data the deployed HTTP
// behaviour is made of; the nginx half itself is checked against the built
// Docker image by hand (no automated e2e exists in this repo).
//
//   npm run build && npm run verify
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptsMarkdown, MARKDOWN } from './negotiate.mjs';
import { mdFileFor } from './markdown.mjs';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const read = (file) => readFileSync(join(dist, file), 'utf8');

test('Accept negotiation agrees with the nginx map', () => {
  // nginx's ~* is case-insensitive; the JS matcher matches.
  assert.equal(acceptsMarkdown('text/markdown'), true);
  assert.equal(acceptsMarkdown('text/markdown, text/html'), true);
  assert.equal(acceptsMarkdown('Text/Markdown'), true);
  assert.equal(acceptsMarkdown('*/*'), false);
  assert.equal(acceptsMarkdown('text/html'), false);
  assert.equal(acceptsMarkdown(''), false);
  assert.equal(acceptsMarkdown(undefined), false);
  assert.equal(acceptsMarkdown('text/markdown-x'), false);
});

test('mdFileFor mirrors fileFor()', () => {
  assert.equal(mdFileFor('/'), 'index.md');
  assert.equal(mdFileFor('/about'), 'about.md');
  assert.equal(mdFileFor('/blog'), 'blog.md');
  assert.equal(mdFileFor('/privacy'), 'privacy.md');
});

test('404 has a Markdown body with recovery links', () => {
  const md = read('404.md');
  assert.ok(md.startsWith('# 404'), 'starts with a title');
  assert.ok(md.length >= 20, 'explains the error in at least 20 characters');
  assert.match(md, /\(https:\/\/[^/]+\/sitemap\.xml\)/, 'links the sitemap');
  assert.match(md, /llms\.txt/, 'links llms.txt');
});

test('the homepage ships a Markdown twin', () => {
  const md = read('index.md');
  assert.ok(md.length > 200, 'nonempty, real content');
  assert.ok(md.startsWith('# Aditya N'), 'starts with the page title');
  assert.match(md, /[Ss]lack bots/);
  assert.match(md, /[Pp]ython/);
});

test('every indexable page and post has an .md twin', async () => {
  const { posts } = await import(`${import.meta.dirname}/../src/data/posts.js`);
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u.replace(/^https?:\/\/[^/]+/, ''));
  // The sitemap is the canonical page list: adding a page adds a twin with no
  // edit here.
  for (const path of locs) {
    const file = mdFileFor(path);
    assert.ok(existsSync(join(dist, file)), `dist/${file} exists for ${path}`);
    assert.ok(read(file).trim().length > 100, `${file} is real content`);
  }
  for (const post of posts) {
    const file = mdFileFor(`/blog/${post.slug}`);
    const md = read(file);
    assert.ok(md.includes(`# ${post.title} —`), `${file} carries the post title`);
    const first = post.markdown.trim().split('\n').find((l) => l.trim() && !l.startsWith('#'));
    assert.ok(first && md.includes(first), `${file} round-trips the source Markdown`);
    const escaped = post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.doesNotMatch(md, new RegExp(`^# ${escaped}\\s*$`, 'm'), `no duplicated H1 in ${file}`);
  }
});

test('nested lists keep their structure in the Markdown copy', async () => {
  const { blocks } = await import('./markdown.mjs');
  const tree = {
    type: 'ul',
    children: [
      { type: 'li', children: ['Top item'] },
      {
        type: 'li',
        children: [
          'Outer',
          {
            type: 'ul',
            children: [
              { type: 'li', children: [{ type: 'a', attrs: { href: '/x' }, children: ['Inner'] }] },
              { type: 'li', children: ['Last', { type: 'ol', children: [{ type: 'li', children: ['One'] }] }] },
            ],
          },
        ],
      },
    ],
  };
  assert.deepEqual(blocks(tree), ['- Top item', '- Outer', '  - [Inner](/x)', '  - Last', '    1. One']);
});

test('nginx negotiates markdown and keeps HTML untouched', () => {
  // The maps are generated from scripts/negotiate.mjs (the same rule the dev
  // middleware and these tests call); this pins the generated artifact and
  // how default.conf consumes it.
  const negotiate = readFileSync(join(root, 'nginx-negotiate.conf'), 'utf8');
  const conf = readFileSync(join(root, 'default.conf'), 'utf8');
  const docker = readFileSync(join(root, 'Dockerfile'), 'utf8');
  assert.match(negotiate, /map \$http_accept \$layout/, 'Accept → extension map');
  assert.match(negotiate, /map \$http_accept \$notfound/, 'Accept → 404-body map');
  assert.ok(negotiate.includes(`"~*${MARKDOWN}" md;`), 'the map carries the exported rule');
  assert.ok(negotiate.includes(`"~*${MARKDOWN}" /404.md;`), 'Markdown errors use 404.md');
  assert.match(conf, /try_files \/index\.\$layout =404;/, 'homepage tries the negotiated copy');
  assert.match(conf, /try_files \$uri\.\$layout \$uri\.html \$uri =404;/, 'extensionless routes fall through md → html');
  assert.match(conf, /error_page 404 \$notfound;/, 'the 404 body follows Accept');
  assert.match(conf, /location = \/404\.md \{ internal; \}/, '404.md is an error body only');
  assert.match(docker, /nginx-negotiate\.conf.*conf\.d/, 'the image installs the generated maps');
  // The Dockerfile maps .md -> text/markdown in the image's mime.types; nginx
  // ships no such entry by default.
  assert.match(docker, /text\/markdown md;/);
  assert.ok(conf.includes('text/markdown'), 'gzip_types includes text/markdown');
});

test('nginx and the dev server stay in agreement', async () => {
  const dev = readFileSync(join(root, 'scripts/dev.mjs'), 'utf8');
  assert.match(dev, /acceptsMarkdown/, 'dev plays the same Accept rule');
});

test('Vary: Accept is a server-level header', () => {
  const headers = readFileSync(join(root, 'security-headers.conf'), 'utf8');
  assert.match(headers, /add_header Vary "Accept" always;/);
});

test('homepage JSON-LD and meta keywords carry the product terms', async () => {
  const site = await import(`${import.meta.dirname}/../src/data/site.js`);
  assert.ok(Array.isArray(site.keywords) && site.keywords.includes('Slack bots'));
  assert.ok(site.keywords.includes('Python'));
  const home = read('index.html');
  assert.match(home, /<meta name="keywords" content="[^"]*Slack bots[^"]*"/);
  assert.match(home, /<title>[^<]*Slack bots[^<]*<\/title>/, 'the title names the product');
  assert.match(home, /slack bots/i);
  assert.match(home, /python/i);
});

test('Organization schema has contactPoint and address', async () => {
  const { organization } = await import(`${import.meta.dirname}/../src/data/site.js`);
  const contact = organization.contactPoint?.[0];
  assert.ok(contact, 'contactPoint present');
  assert.ok(contact.email?.includes('@'), 'contactPoint has an email');
  assert.ok(contact.contactType, 'contactPoint has a contactType');
  assert.equal(organization.address?.['@type'], 'PostalAddress');
  assert.ok(organization.address.addressLocality && organization.address.addressCountry);
  const home = read('index.html');
  const ld = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const org = ld['@graph'].find((node) => node['@type'] === 'Organization');
  assert.ok(org, 'homepage graph carries the Organization');
  assert.ok(org.contactPoint?.[0], 'published contactPoint');
  assert.equal(org.address?.['@type'], 'PostalAddress', 'published address');
});

test('llms.txt tells agents when to use the site', () => {
  const llms = read('llms.txt');
  assert.ok(llms.startsWith(`# ${'Aditya N'} — adityan.dev`), 'starts with the H1 title');
  assert.match(llms, /^> /m, 'blockquote summary present (llmstxt.org format)');
  assert.match(llms, /## When to use/, 'when-to-use section present');
  assert.ok(/not the right tool/i.test(llms), 'says where NOT to reach for it');
  assert.match(llms, /Accept: text\/markdown/, 'explains how to call in Markdown');
  assert.match(llms, /sitemap\.xml/, 'links the sitemap');
  assert.match(llms, /feed\.xml/, 'links the feed');
  assert.ok(llms.split('\n').filter((line) => /^\s*- \[/.test(line)).length >= 10, 'link lists present');
});

test('privacy page is real content, not a stub', async () => {
  const html = read('privacy.html');
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  assert.ok(text.length >= 500, `readable content over 500 characters (got ${text.length})`);
  assert.match(text, /cookies/i);
  assert.match(text, /localStorage/);
  assert.ok(existsSync(join(dist, 'og', 'privacy.png')), 'privacy page gets a social card');
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/[^/]+\/privacy<\/loc>/);
});

test('build artifacts all exist', () => {
  for (const file of ['index.html', 'index.md', '404.html', '404.md', 'llms.txt', 'robots.txt', 'sitemap.xml', 'feed.xml', 'about.html', 'contact.html', 'privacy.html']) {
    assert.ok(existsSync(join(dist, file)), `dist/${file} exists`);
  }
});
