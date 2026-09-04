export const site = {
  name: 'Aditya N',
  email: 'hey@adityan.dev',
  origin: 'https://adityan.dev',
  repo: 'https://github.com/DragonSenseiGuy/adityan.dev',
  feedDescription: 'Build logs, thoughts on AI and dev tools, and notes from a homelab.',
  substack: 'https://dragonsenseiguy.substack.com',
};

// Each page's social card is generated from its own copy; the path mirrors
// the page's, so about.html gets /og/about.png.
export const ogImageFor = (file) => `${site.origin}/og/${file.replace(/\.html$/, '.png')}`;

// og:image has to be absolute, so a site-relative override gets the origin.
export const absoluteUrl = (url) => (/^https?:\/\//.test(url) ? url : `${site.origin}${url.startsWith('/') ? '' : '/'}${url}`);

// A post's card: its own `ogImage` if it set one, otherwise the generated card.
export const cardFor = (post, file) => (post.ogImage ? absoluteUrl(post.ogImage) : ogImageFor(file));

export const socials = {
  github: 'https://github.com/DragonSenseiGuy/',
  linkedin: 'https://www.linkedin.com/in/adityaneni/',
  discord: 'https://discord.com/users/1374119550467051542',
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
  url: 'https://adityan.dev/',
  email: 'hey@adityan.dev',
  jobTitle: 'Student Developer',
  description:
    'Aditya N (DragonSenseiGuy) is a student developer at Hack Club building AI developer tools, Slack bots, and self-hosted apps.',
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
