// Satori wants React-shaped elements ({ type, props }), not the HTML-string
// nodes src/jsx.js builds, so OG cards compile against this factory instead.
export const Fragment = 'div';

export function h(type, props, ...children) {
  const { children: propChildren, ...rest } = props || {};
  const kids = (children.length ? children : [propChildren]).flat(Infinity).filter((c) => c != null && c !== false);
  if (typeof type === 'function') return type({ ...rest, children: kids });
  return { type, props: { ...rest, children: kids.length === 1 ? kids[0] : kids } };
}
