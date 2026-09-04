#!/usr/bin/env node
/*
 * build-blog.js — turns the Markdown posts in POSTS_DIR into static HTML.
 *
 * Output:
 *   • blog/<slug>.html   — one page per post
 *   • blog.html          — the post index (regenerated between the markers)
 *
 * Re-run after adding or editing a post:  node scripts/build-blog.js
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = process.env.POSTS_DIR || path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'blog');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- tiny TOML-frontmatter reader (only the fields we use) ---------------
function parseFrontmatter(raw) {
  const m = raw.match(/^\+\+\+\s*\r?\n([\s\S]*?)\r?\n\+\+\+\s*\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('[')) {
      data[key] = (val.match(/"([^"]*)"/g) || []).map((s) => s.slice(1, -1));
    } else if (val.startsWith('"')) {
      data[key] = val.replace(/^"|"$/g, '');
    } else {
      data[key] = val;
    }
  }
  return { data, body: raw.slice(m[0].length) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

const SOCIALS = `<div class="socials">
          <a href="https://github.com/DragonSenseiGuy/" aria-label="GitHub" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/aditya-n-2a7a42372/" aria-label="LinkedIn" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
          </a>
          <a href="https://discord.com/users/1374119550467051542" aria-label="Discord" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
          </a>
        </div>`;

function footer(prefix) {
  return `  <footer class="site-footer">
    <div class="container">
      <div class="footer-inner">
        <div>
          <p class="footer-name">Aditya N</p>
          <p class="footer-tagline">Building small, useful, occasionally silly things.</p>
        </div>
        ${SOCIALS}
      </div>
      <div class="footer-bottom">
        <span>&copy; <span data-year>2026</span> Aditya N</span>
        <a href="https://github.com/DragonSenseiGuy/adityan.dev" target="_blank" rel="noopener">Open source on GitHub</a>
      </div>
    </div>
  </footer>`;
}

const THEME_SCRIPT = `<script>
    (function () {
      try {
        var t = localStorage.getItem('theme');
        if (t !== 'light' && t !== 'dark') {
          t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        document.documentElement.dataset.theme = t;
      } catch (e) {}
    })();
  </${'script'}>`;

const THEME_TOGGLE = `<button class="theme-toggle" type="button" aria-label="Toggle color theme">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>`;

function nav(prefix) {
  return `  <header class="site-nav">
    <div class="nav-inner">
      <a class="brand" href="${prefix}index.html">adityan<span class="tld">.dev</span></a>
      <nav class="nav-links" aria-label="Main navigation">
        <a href="${prefix}about.html">About</a>
        <a href="${prefix}projects.html">Projects</a>
        <a href="${prefix}blog.html" aria-current="page">Blog</a>
        <a href="${prefix}contact.html">Contact</a>
      </nav>
      ${THEME_TOGGLE}
    </div>
  </header>`;
}

const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.78em' font-size='84' font-family='monospace' fill='%23ededed'>a_</text></svg>">`;

function postPage(post) {
  const prefix = '../';
  const tags = (post.tags || [])
    .map((t) => `<span>${esc(t)}</span>`)
    .join('');
  const canonical = `https://adityan.dev/blog/${post.slug}.html`;
  const desc = esc(post.description || '');
  const title = esc(post.title);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description || '',
    datePublished: post.date,
    dateModified: post.date,
    url: canonical,
    mainEntityOfPage: canonical,
    keywords: post.tags || [],
    author: {
      '@type': 'Person',
      name: 'Aditya N',
      alternateName: ['DragonSenseiGuy', 'Dragon Sensei Guy'],
      url: 'https://adityan.dev/',
    },
    publisher: { '@type': 'Person', name: 'Aditya N', url: 'https://adityan.dev/' },
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Aditya N</title>
  <meta name="description" content="${desc}">
  <meta name="author" content="Aditya N">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Aditya N">
  <meta property="og:title" content="${title} — Aditya N">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://adityan.dev/og-image.png">
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:author" content="Aditya N">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} — Aditya N">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://adityan.dev/og-image.png">
  ${FAVICON}
  ${THEME_SCRIPT}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400..500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}styles.css">
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>

${nav(prefix)}

  <main class="container">
    <article class="article">
      <p><a href="${prefix}blog.html" class="back-link">&larr; Blog</a></p>
      <h1 class="article-title">${esc(post.title)}</h1>
      <div class="article-meta">
        <time datetime="${post.date}">${fmtDate(post.date)}</time>
        ${tags ? `<span class="post-tags">${tags}</span>` : ''}
      </div>
      <div class="prose article-body">
${post.html}
      </div>
      <p class="article-foot"><a href="${prefix}blog.html" class="back-link">&larr; Back to all posts</a></p>
    </article>
  </main>

${footer(prefix)}

  <script src="${prefix}script.js"></script>
</body>
</html>
`;
}

function indexRows(posts) {
  return posts
    .map(
      (p) => `        <a class="post-row" href="blog/${p.slug}.html">
          <time datetime="${p.date}">${fmtDate(p.date)}</time>
          <div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description || '')}</p>
          </div>
        </a>`
    )
    .join('\n');
}

// --- run ------------------------------------------------------------------
const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
const posts = files.map((file) => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const slug = data.slug || file.replace(/\.md$/, '');
  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date,
    tags: data.tags || [],
    html: marked.parse(body),
  };
});

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
for (const post of posts) {
  fs.writeFileSync(path.join(OUT_DIR, `${post.slug}.html`), postPage(post));
}

// splice the generated rows into blog.html between the markers
const blogPath = path.join(ROOT, 'blog.html');
let blog = fs.readFileSync(blogPath, 'utf8');
const START = '<!-- POSTS:START -->';
const END = '<!-- POSTS:END -->';
const rows = indexRows(posts);
blog = blog.replace(
  new RegExp(`${START}[\\s\\S]*${END}`),
  `${START}\n${rows}\n        ${END}`
);
fs.writeFileSync(blogPath, blog);

console.log(`Built ${posts.length} posts -> blog/, updated blog.html`);
