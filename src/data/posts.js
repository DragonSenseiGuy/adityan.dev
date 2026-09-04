// Loads the Markdown posts at build time. POSTS_DIR is set by scripts/build.mjs
// before the page modules run.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

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

const dir = process.env.POSTS_DIR;

export const posts = readdirSync(dir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
    const slug = data.slug || file.replace(/\.md$/, '');
    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date,
      tags: data.tags || [],
      url: `https://adityan.dev/blog/${slug}.html`,
      html: marked.parse(body),
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));
