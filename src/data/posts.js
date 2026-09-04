// Loads the Markdown posts at build time, from the content/ directory next to
// this module.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { url } from './site.js';

// Images in post bodies are below the fold by definition.
marked.use({
  renderer: {
    image({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text}"${titleAttr} loading="lazy" decoding="async">`;
    },
  },
});

// TOML frontmatter, only the fields the site uses.
function parseFrontmatter(raw) {
  const match = raw.match(/^\+\+\+\s*\r?\n([\s\S]*?)\r?\n\+\+\+\s*\r?\n?/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const value = kv[2].trim();
    if (value.startsWith('[')) data[kv[1]] = (value.match(/"([^"]*)"/g) || []).map((s) => s.slice(1, -1));
    else data[kv[1]] = value.replace(/^"|"$/g, '');
  }
  return { data, body: raw.slice(match[0].length) };
}

const dir = fileURLToPath(new URL('../../content/posts', import.meta.url));

export const posts = readdirSync(dir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
    const slug = data.slug || file.replace(/\.md$/, '');
    // Everything else has a sensible default; a date does not. Without one the
    // sitemap, the feed and the post header all render "Invalid Date".
    if (!data.date) throw new Error(`content/posts/${file}: missing "date" in the frontmatter`);
    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date,
      tags: data.tags || [],
      // `image` rides along inside the generated card; `ogImage` replaces the
      // generated card entirely. Both are optional. See the README.
      image: data.image || null,
      ogImage: data.ogImage || null,
      url: url(`/blog/${slug}`),
      html: marked.parse(body),
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));
