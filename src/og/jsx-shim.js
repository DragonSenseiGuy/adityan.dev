// Satori wants React-shaped elements ({ type, props }), not the HTML-string
// nodes src/jsx.js builds, so OG cards compile against this factory instead.
// Satori has no fragment: a bare <>...</> would land inside a parent that has
// not been told to lay out children, and fail there instead of here. Cards
// return a single root element, so nothing should reach this.
export function Fragment() {
  throw new Error('OG cards cannot use fragments — wrap the children in a flex <div> instead.');
}

export function h(type, props, ...children) {
  const { children: propChildren, ...rest } = props || {};
  const kids = (children.length ? children : [propChildren]).flat(Infinity).filter((c) => c != null && c !== false);
  if (typeof type === 'function') return type({ ...rest, children: kids });
  // A childless element must report no children at all: satori reads an empty
  // array as "has a child node" and demands display:flex on the parent.
  const kidProp = kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids;
  return { type, props: { ...rest, children: kidProp } };
}
