// Minimal JSX runtime that renders to an HTML string at build time. No
// framework, no client runtime — the site ships as plain static files.
//
// h() builds a node tree, render() serialises it. Children that are all
// elements get one line each; anything mixed with text stays inline, so
// whitespace-sensitive markup renders exactly as written.

// Symbol.for so the runtime bundled into the page modules and the one this
// script imports agree on the same Fragment.
export const Fragment = Symbol.for('jsx.Fragment');

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr',
]);

// SVG shapes carry no children and are written self-closing.
const SELF_CLOSING = new Set([
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop',
]);

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// Escape hatch for HTML that is already markup (rendered Markdown, JSON-LD).
export const raw = (value) => ({ raw: String(value) });

function flatten(children, out = []) {
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null || child === false || child === true || child === '') continue;
    if (Array.isArray(child)) flatten(child, out);
    else if (child && child.type === Fragment) flatten(child.children, out);
    else out.push(child);
  }
  return out;
}

export function h(type, props, ...rest) {
  const { children: propChildren, ...attrs } = props || {};
  const children = flatten(rest.length ? rest : propChildren);
  if (typeof type === 'function') return type({ ...attrs, children });
  return { type, attrs, children };
}

const isElement = (node) => node != null && typeof node === 'object' && node.raw === undefined;

function serialise(node, depth) {
  if (node == null || node === false || node === true) return '';
  if (typeof node !== 'object') return escapeText(String(node));
  if (node.raw !== undefined) return node.raw;
  if (node.type === Fragment) return node.children.map((c) => serialise(c, depth)).join('');

  let open = `<${node.type}`;
  for (const [name, value] of Object.entries(node.attrs)) {
    if (value == null || value === false) continue;
    open += value === true ? ` ${name}` : ` ${name}="${escapeAttr(String(value))}"`;
  }

  if (VOID.has(node.type)) return `${open}>`;
  if (!node.children.length && SELF_CLOSING.has(node.type)) return `${open}/>`;

  const pad = '  '.repeat(depth);
  if (node.children.length && node.children.every(isElement)) {
    const inner = node.children
      .map((child) => `${pad}  ${serialise(child, depth + 1)}`)
      .join('\n');
    return `${open}>\n${inner}\n${pad}</${node.type}>`;
  }
  return `${open}>${node.children.map((c) => serialise(c, depth)).join('')}</${node.type}>`;
}

export const render = (node) => `<!DOCTYPE html>\n${serialise(node, 0)}\n`;
