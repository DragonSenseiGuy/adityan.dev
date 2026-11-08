// Markdown renderers for the agent-facing copies of the site: every indexable
// page ships a .md twin, blog posts use their own source, and the 404 has a
// Markdown body. These files are what nginx serves when a client asks for
// Accept: text/markdown.
//
// Pages and posts are built once below; nothing here ships to the browser.
import { site, url, oxford, specialties, stack } from '../src/data/site.js';

// A route's Markdown file in dist/, mirroring fileFor() in src/data/site.js.
export const mdFileFor = (path) => {
  if (path === '/') return 'index.md';
  return `${path.slice(1)}.md`;
};

// -- JSX tree -> Markdown ----------------------------------------------------
// Page modules export an already-expanded `element` tree (the same one the
// HTML build walks), so the Markdown copy is generated from one source of
// truth and cannot drift from the visual page.

// Elements whose whole point is presentation or metadata: skipped everywhere.
const SKIP = new Set(['script', 'style', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'br', 'hr', 'head', 'meta', 'link', 'img', 'iframe']);
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// Inline nodes -> one Markdown string. Links, emphasis and code survive;
// icons and canvases do not.
function inline(node) {
  if (node == null || node === false || node === true) return '';
  if (typeof node !== 'object') return String(node);
  if (node.raw !== undefined) return htmlToText(node.raw);
  if (node.type === Symbol.for('jsx.Fragment')) return node.children.map(inline).join('');
  if (SKIP.has(node.type)) return '';
  const { attrs, children } = node;
  const attrs_ = attrs || {};
  const inner = children.map(inline).join('').trim();
  if (node.type === 'a') return attrs_.href ? `[${inner || attrs_.href}](${attrs_.href})` : inner;
  if (node.type === 'strong' || node.type === 'b') return inner ? `**${inner}**` : '';
  if (node.type === 'em' || node.type === 'i') return inner ? `*${inner}*` : '';
  if (node.type === 'code') return inner ? `\`${inner}\`` : '';
  return inner;
}

// Anchors anywhere below `node`, in document order — used for the nav line.
function anchors(node, out = []) {
  if (node == null || typeof node !== 'object') return out;
  if (node.type === 'a' && node.attrs?.href) {
    out.push(inline(node));
    return out;
  }
  for (const child of node.children || []) anchors(child, out);
  return out;
}

// Block nodes -> an array of Markdown blocks (paragraphs, headings, lists).
// Inline elements met at block level become their inline text, which keeps
// button links and card titles readable. Exported so the tests can pin the
// tree → Markdown contract directly.
export function blocks(node) {
  if (node == null || typeof node !== 'object') return typeof node === 'string' ? [node] : [];
  if (node.raw !== undefined) return [htmlToText(node.raw)]; // markdown already? pragmatic strip
  if (node.type === Symbol.for('jsx.Fragment')) return node.children.flatMap(blocks);

  const { type, attrs, children } = node;
  if (SKIP.has(type)) return [];

  if (HEADINGS.has(type)) {
    const text = inline(node);
    return text ? [`${'#'.repeat(Number(type[1]))} ${text}`] : [];
  }
  if (type === 'p') return [inline(node)].filter((text) => text.trim());
  if (type === 'blockquote') return inline(node).trim() ? [`> ${inline(node)}`] : [];
  if (type === 'ul' || type === 'ol') return listBlock(children, type === 'ol');
  // The site chrome: navigation becomes one link line, the footer (social
  // icons, copyright) contributes nothing an agent cannot get elsewhere.
  if (type === 'header') {
    const nav = anchors(node);
    return nav.length ? [`Navigation: ${nav.join(' · ')}`] : [];
  }
  if (type === 'footer') return [];
  // A link that wraps block content (project cards, post rows, hero buttons)
  // is rendered transparently, with its URL woven back into the first block
  // it produces: Markdown cannot wrap block elements in a link, but losing
  // the repo or route would hurt an agent following the page.
  if (type === 'a' && attrs?.href && children.length) {
    const inner = children.flatMap(blocks);
    if (!inner.length) return [];
    const text = inline(node).trim() || attrs.href;
    const headingIndex = inner.findIndex((block) => /^#{1,6} /.test(block));
    if (headingIndex !== -1) {
      // Project card / post row: link the card's own title.
      inner[headingIndex] = inner[headingIndex].replace(/^(#{1,6} )(.+)$/, (m, hashes, sub) => `\n${hashes}[${sub}](${attrs.href})`).trim();
    } else if (text.length < 90 && inner[0].length < 90) {
      // A short label (hero button, inline card link): link it whole.
      inner[0] = `[${inner[0].trim()}](${attrs.href})`;
    } else {
      // Long inline body: leave the prose and add the route after it.
      inner.push(`(${attrs.href})`);
    }
    return inner;
  }
  // Everything else (body, main, article, figures, whatever the layout grows
  // tomorrow) is a container to walk into.
  return children.flatMap(blocks);
}

// A list -> one Markdown line per item. Nested lists indent under the parent
// marker's width, so the structure survives the copy instead of flattening
// into run-on text.
function listBlock(items, ordered, depth = 0) {
  const lines = [];
  for (const [index, li] of items.entries()) {
    if (typeof li !== 'object' || li.raw !== undefined || li.type !== 'li') continue;
    const marker = ordered ? `${index + 1}. ` : '- ';
    const parts = [];
    for (const child of li.children) {
      const nested =
        typeof child === 'object' && child && (child.type === 'ul' || child.type === 'ol');
      parts.push(
        nested
          ? listBlock(child.children, child.type === 'ol', depth + marker.length)
          : typeof child === 'string' ? child : inline(child)
      );
    }
    // Inline children lead the line; nested lists follow in document order.
    const text = parts.filter((part) => typeof part === 'string' || typeof part === 'number').map(String).join('').trim();
    if (text) lines.push(' '.repeat(depth) + marker + text);
    for (const part of parts) if (Array.isArray(part)) lines.push(...part);
  }
  return lines;
}

const htmlToText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|section|article)>/gi, '\n\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').trim();

// One page -> its Markdown copy. The title and description come from the
// page's own <head>, so the copy says exactly what the HTML says.
export function pageMarkdown(page) {
  const html = page.element;
  const head = html.children.find((node) => node.type === 'head');
  const body = html.children.find((node) => node.type === 'body');
  const title = textOf(head.children.find((node) => node.type === 'title'));
  const description =
    head.children.find((node) => node.type === 'meta' && node.attrs?.name === 'description')?.attrs?.content ?? '';

  const content = blocks(body).join('\n\n');
  return [`# ${title}`, description, content].filter(Boolean).join('\n\n') + '\n';
}

const textOf = (node) => (typeof node === 'object' && node ? (node.children ?? []).map(textOf).join('') : String(node ?? ''));

// One post -> its Markdown copy, straight from the Markdown source the HTML
// was rendered from. Round-trips perfectly. A body that opens by restating
// its own title as an H1 (`# ChatGPT Atlas` under title = "ChatGPT Atlas")
// loses that line: the twin's document title already carries it.
export function postMarkdown(post) {
  const source = post.markdown.trim();
  const [first, ...rest] = source.split('\n');
  const restatedTitle = first.match(/^# (.+)$/)?.[1]?.trim() === post.title.trim();
  const body = restatedTitle ? rest.join('\n').trim() : source;
  const meta = [new Date(post.date).toISOString().slice(0, 10), ...(post.tags || [])].filter(Boolean).join(' · ');
  return [
    `# ${post.title} — ${site.name}`,
    `*${meta}*`,
    post.description,
    body,
    '',
    `— [Back to all posts](${url('/blog')})`,
  ]
    .filter((line) => line != null && line !== '')
    .join('\n\n') + '\n';
}

// The Markdown body of a 404, served by nginx's error_page for any missing
// path when the client asked for text/markdown: what happened, what the site
// is, and the routes an agent can recover through.
export function notFoundMarkdown(site) {
  return [
    '# 404 — Page not found',
    '',
    'There is no page at this URL on adityan.dev.',
    `adityan.dev is the personal site of ${site.name} (DragonSenseiGuy), a developer in Boston building ${oxford(specialties)} in ${stack.join(' and ')}.`,
    'You are seeing this instead of an HTML error page because the request asked for text/markdown.',
    '',
    'Where to go next:',
    '',
    `- [Home](${site.origin}/) — who Aditya is and what he builds`,
    `- [About](${site.origin}/about)`,
    `- [Projects](${site.origin}/projects)`,
    `- [Blog](${site.origin}/blog)`,
    `- [Sitemap](${site.origin}/sitemap.xml) — every indexable page`,
    `- [llms.txt](${site.origin}/llms.txt) — the machine-readable site index for agents`,
  ].join('\n') + '\n';
}
