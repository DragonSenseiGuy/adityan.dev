// Verification for the agent-readiness features: Markdown negotiation, the
// agent-friendly 404, llms.txt, brand keywords, Organization schema, and the
// privacy page. Runs with node --test scripts/verify.mjs after a build.
//
//   npm run build && npm run verify
//
// The end-to-end HTTP behaviour (the nginx half) is checked against the built
// Docker image; these tests pin the files and data that behaviour is made of.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptsMarkdown } from './negotiate.mjs';
import { mdFileFor } from './markdown.mjs';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const read = (file) => readFileSync(join(dist, file), 'utf8');

test('Accept negotiation agrees with the nginx map', () => {
  // The `map $http_accept` blocks in default.conf must answer the same way
  // this function does, or the site behaves differently locally vs deployed.
  assert.equal(acceptsMarkdown('text/markdown'), true);
  assert.equal(acceptsMarkdown('text/markdown, text/html'), true);
  assert.equal(acceptsMarkdown('Text/Markdown'.toLowerCase()), true);
  assert.equal(acceptsMarkdown('*/*'), false);
  assert.equal(acceptsMarkdown('text/html'), false);
  assert.equal(acceptsMarkdown(''), false);
  assert.equal(acceptsMarkdown(undefined), false);
  // A close-but-not-it type must not leak into the Markdown branch.
  assert.equal(acceptsMarkdown('text/markdown-x'), false);
});

test('mdFileFor mirrors fileFor()', () => {
  assert.equal(mdFileFor('/'), 'index.md');
  assert.equal(mdFileFor('/about'), 'about.md');
  assert.equal(mdFileFor('/blog'), 'blog.md');
  assert.equal(mdFileFor('/privacy'), 'privacy.md');
});

// -- 1. agent-friendly 404 ----------------------------------------------------
test('404 has a Markdown body with recovery links', () => {
  const md = read('404.md');
  assert.ok(md.startsWith('# 404'), 'starts with a title');
  assert.ok(md.length >= 20, 'explains the error in at least 20 characters');
  assert.match(md, /\(https:\/\/[^/]+\/sitemap\.xml\)/, 'links the sitemap');
  assert.match(md, /llms\.txt/, 'links llms.txt');
});

// -- 2. Markdown content negotiation ------------------------------------------
test('the homepage ships a Markdown twin', () => {
  const md = read('index.md');
  assert.ok(md.length > 200, 'nonempty, real content');
  assert.ok(md.startsWith('# Aditya N'), 'starts with the page title');
  // The brand words the audit searches for must be on the page itself.
  assert.match(md, /[Ss]lack bots/);
  assert.match(md, /[Pp]ython/);
});

test('every indexable page and post has an .md twin', async () => {
  const { posts } = await import(`${import.meta.dirname}/../src/data/posts.js`);
  for (const page of ['/', '/about', '/projects', '/blog', '/contact']) {
    assert.ok(existsSync(join(dist, mdFileFor(page))), `dist${mdFileFor(page)} exists`);
    assert.ok(read(mdFileFor(page)).trim().length > 100);
  }
  for (const post of posts) {
    const file = mdFileFor(`/blog/${post.slug}`);
    assert.ok(existsSync(join(dist, file)), `dist/${file} exists`);
    const md = read(file);
    assert.ok(md.includes(post.title), `${file} carries the post title`);
    assert.ok(post.markdown.split('\n')[0] && md.includes(post.markdown.trim().split('\n')[0]), `${file} round-trips the source Markdown`);
  }
});

test('nginx negotiates markdown and keeps HTML untouched', () => {
  const conf = readFileSync(join(root, 'default.conf'), 'utf8');
  assert.match(conf, /map \$http_accept \$layout/, 'Accept → extension map');
  assert.match(conf, /"~\*\\btext\/markdown\(\?!\[\\w\/-\]\)"  md;/, 'text/markdown triggers md');
  assert.match(conf, /try_files \/index\.\$layout =404;/, 'homepage tries the negotiated copy');
  assert.match(conf, /try_files \$uri\.\$layout \$uri\.html \$uri =404;/, 'extensionless routes fall through md → html');
  assert.match(conf, /error_page 404 \$notfound;/, 'the 404 body follows Accept');
  assert.match(conf, /"~\*\\btext\/markdown\(\?!\[\\w\/-\]\)"  \/404\.md;/, 'Markdown errors use 404.md');
  assert.match(conf, /location = \/404\.md \{ internal; \}/, '404.md is an error body only');
  // The Dockerfile maps .md -> text/markdown in the image's mime.types; nginx
  // ships no such entry by default.
  assert.match(readFileSync(join(root, 'Dockerfile'), 'utf8'), /text\/markdown md;/);
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

// -- 3. brand discoverability --------------------------------------------------
test('homepage JSON-LD and meta keywords carry the product terms', async () => {
  const site = await import(`${import.meta.dirname}/../src/data/site.js`);
  assert.ok(Array.isArray(site.keywords) && site.keywords.includes('Slack bots'));
  assert.ok(site.keywords.includes('Python'));
  const home = read('index.html');
  assert.match(home, /<meta name="keywords" content="[^"]*Slack bots[^"]*"/);
  assert.match(home, /<title>[^<]*Slack bots[^<]*<\/title>/, 'the title names the product');
  // ..and the visible copy uses the same words.
  assert.match(home, /slack bots/i);
  assert.match(home, /python/i);
});

// -- 5. Organization schema -----------------------------------------------------
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

// -- 4. llms.txt ----------------------------------------------------------------
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

// -- 6. trust anchor page --------------------------------------------------------
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
  // The build's sitemap includes it.
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/[^/]+\/privacy<\/loc>/);
});

test('build artifacts all exist', () => {
  for (const file of ['index.html', 'index.md', '404.html', '404.md', 'llms.txt', 'robots.txt', 'sitemap.xml', 'feed.xml', 'about.html', 'contact.html', 'privacy.html']) {
    assert.ok(existsSync(join(dist, file)), `dist/${file} exists`);
  }
});
