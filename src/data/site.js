// The one host this site is meant to be indexed on. Production is a Dokploy
// VPS serving the nginx image; Vercel is only ever a test target.
const CANONICAL_ORIGIN = 'https://adityan.dev';

// Where this build will actually be served from. Vercel exports the deployment
// host, so preview builds link to themselves instead of to a domain that does
// not have their files; SITE_ORIGIN overrides it, and anything else (local,
// Docker) falls back to the canonical domain.
const deployHost =
  (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  process.env.VERCEL_URL;
const origin = process.env.SITE_ORIGIN || (deployHost ? `https://${deployHost}` : CANONICAL_ORIGIN);

export const site = {
  name: 'Aditya N',
  email: 'hey@adityan.dev',
  origin,
  // Anything served from another host is a test build: it says noindex on every
  // page and disallows everything in robots.txt, so a preview can never turn up
  // in search as a second copy of the site.
  indexable: origin === CANONICAL_ORIGIN,
  repo: 'https://github.com/DragonSenseiGuy/adityan.dev',
  feedDescription: 'Build logs, thoughts on AI and dev tools, and notes from a homelab.',
  substack: 'https://dragonsenseiguy.substack.com',
};

// A route's file in dist/: '/' is index.html, '/blog/x' is blog/x.html. One
// `path` per page drives the filename, the canonical URL and the card.
export const fileFor = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

// Each page's social card is generated from its own copy; the path mirrors
// the page's, so /about gets /og/about.png.
export const ogImageFor = (path) => `${origin}/og/${fileFor(path).replace(/\.html$/, '.png')}`;

// Every absolute URL the site emits — canonicals, JSON-LD ids, feeds — goes
// through here, so there is one place that knows the host.
export const url = (path = '/') => `${origin}${path}`;

// og:image has to be absolute, so a site-relative override gets the origin.
export const absoluteUrl = (href) => (/^https?:\/\//.test(href) ? href : url(href.startsWith('/') ? href : `/${href}`));

// A post's card: its own `ogImage` if it set one, otherwise the generated card.
export const cardFor = (post, path) => (post.ogImage ? absoluteUrl(post.ogImage) : ogImageFor(path));

// The brand words: search engines and agent-audit tools take product terms
// from the homepage's JSON-LD keywords/knowsAbout and the meta keywords tag,
// so they are listed in both folds and the homepage copy uses the same
// words. specialties and stack are the same terms at sentence grain: every
// surface that describes what he builds (JSON-LD descriptions, llms.txt, the
// Markdown 404) composes them, so the words cannot drift apart.
export const keywords = [
  'Slack bots', 'Python', 'AI developer tools', 'GitHub Apps',
  'LLM APIs', 'Vue', 'self-hosted apps', 'homelab', 'Boston',
];

// ['a', 'b', 'c'] -> 'a, b, and c'
export const oxford = (items) => `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;

export const specialties = ['AI developer tools', 'Slack bots', 'GitHub Apps', 'self-hosted apps'];
export const stack = ['Python', 'JavaScript'];

export const socials = {
  github: 'https://github.com/DragonSenseiGuy/',
  linkedin: 'https://www.linkedin.com/in/adityaneni/',
  discord: 'https://discord.com/users/1374119550467051542',
};

// The Organization node the homepage graph carries. Verified entities have a
// real address and a way to be contacted, so an agent can answer "who runs
// this" and "how do I reach them" without leaving the page.
export const organization = {
  '@type': 'Organization',
  name: 'Aditya N (DragonSenseiGuy)',
  url: url('/'),
  email: site.email,
  description: `${site.name} (DragonSenseiGuy) builds ${oxford(specialties)} in ${stack.join(' and ')}.`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Boston',
    addressRegion: 'MA',
    addressCountry: 'US',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: site.email,
      availableLanguage: 'English',
    },
  ],
  knowsAbout: keywords,
  sameAs: Object.values(socials),
};

export const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export const person = {
  '@type': 'Person',
  name: 'Aditya N',
  alternateName: ['DragonSenseiGuy', 'Dragon Sensei Guy', 'Dragon', 'Aditya'],
  url: url('/'),
  email: 'hey@adityan.dev',
  jobTitle: 'Developer',
  description: `${site.name} (DragonSenseiGuy) is a developer building ${oxford(specialties)}.`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Boston',
    addressCountry: 'US',
  },
  affiliation: {
    '@type': 'Organization',
    name: 'Hack Club',
    url: 'https://hackclub.com',
  },
  knowsAbout: ['AI developer tools', 'Slack bots', 'Self-hosting', 'Python', 'Vue', 'LLM APIs'],
  sameAs: [
    'https://github.com/DragonSenseiGuy',
    'https://www.linkedin.com/in/adityaneni/',
    'https://dragonsenseiguy.substack.com',
  ],
};
