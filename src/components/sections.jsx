import { ArrowUpRightIcon } from './icons.jsx';

// `variant` picks the backdrop framing in hero-canvas.js.
export function Hero({ variant = 'page', class: extra, id = 'page-title', children }) {
  const isHome = variant === 'hero';
  return (
    <section
      class={isHome ? 'hero' : `page-hero${extra ? ` ${extra}` : ''}`}
      aria-label={isHome ? 'Introduction' : null}
      aria-labelledby={isHome ? null : id}
    >
      <canvas class="hero-canvas" data-hero-canvas={variant} aria-hidden="true"></canvas>
      {children}
    </section>
  );
}

export function SectionHead({ id, title, children }) {
  return (
    <div class="section-head">
      <h2 class="section-title" id={id}>{title}</h2>
      {children}
    </div>
  );
}

// Featured items link as a whole row; archive items carry their own links.
export function WorkItem({ item }) {
  const body = (
    <Fragment>
      <h3 class="work-name">
        {item.links ? <a href={item.href} target="_blank" rel="noopener">{item.name}</a> : item.name}
      </h3>
      <p class="work-desc">{item.desc}</p>
      <div class="work-aside">
        <p class="work-stack">{item.stack}</p>
        {item.links && (
          <div class="work-links">
            {item.links.map((link) => (
              <a href={link.href} target="_blank" rel="noopener">{link.label} <ArrowUpRightIcon /></a>
            ))}
          </div>
        )}
      </div>
    </Fragment>
  );

  if (item.links) return <article class="work-item">{body}</article>;
  return <a class="work-item" href={item.href} target="_blank" rel="noopener">{body}</a>;
}

export function WorkList({ items }) {
  return (
    <div class="work-list">
      {items.map((item) => <WorkItem item={item} />)}
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function PostList({ posts }) {
  return (
    <div class="post-list">
      {posts.map((post) => (
        <a class="post-row" href={`/blog/${post.slug}`}>
          <time datetime={post.date}>{formatDate(post.date)}</time>
          <div>
            <h3>{post.title}</h3>
            <p>{post.description}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export function Closing({ id = 'cta-title', title, children }) {
  return (
    <section class="closing" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
