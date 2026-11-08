// sitemap.xml and the RSS feed, both generated from the same page/post data.
import { oxford, specialties, stack } from '../src/data/site.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// lastmod is only emitted where a real date exists; a build timestamp on every
// page would just tell crawlers the whole site changed each deploy.
export function sitemap({ pages, posts }) {
  const urls = [
    ...pages,
    ...posts.map((post) => ({ loc: post.url, lastmod: post.date.slice(0, 10) })),
  ];
  const body = urls
    .map(({ loc, lastmod }) =>
      ['  <url>', `    <loc>${esc(loc)}</loc>`, lastmod ? `    <lastmod>${lastmod}</lastmod>` : null, '  </url>']
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function rss({ site, posts }) {
  const items = posts
    .map(
      (post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(post.url)}</link>
      <guid isPermaLink="true">${esc(post.url)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${esc(post.description)}</description>
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${site.origin}/blog</link>
    <atom:link href="${site.origin}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(site.feedDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(posts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

// robots.txt is here rather than in the repo root because the sitemap it points
// at has to be an absolute URL, and only the build knows the origin. A build
// that is not on the canonical host turns crawlers away entirely.
export const robots = ({ site }) =>
  site.indexable
    ? `User-agent: *
Allow: /

Sitemap: ${site.origin}/sitemap.xml
`
    : `# Not the canonical host — this is a test build.
User-agent: *
Disallow: /
`;

// llms.txt (https://llmstxt.org) — the machine-readable index agents fetch
// first. First line is the H1, then an optional blockquote summary, then
// '##' sections with link lists. The "When to use" section is the part agents
// look for: which jobs this site is the right tool for, and what to do
// instead when it is not.
export const llms = ({ site, posts }) => {
  return `# ${site.name} — adityan.dev

> Personal site of Aditya N, known online as DragonSenseiGuy (or dsg, or dragon). A developer in Boston who builds ${oxford(specialties)}, mostly in ${stack.join(' and ')}, alongside Hack Club.

## When to use this site

Reach for these pages when an agent needs one of the following — and, equally important, skip this site for everything else:

- **Looking up who someone is.** Identity resolution for "DragonSenseiGuy", "Aditya N", "dsg", or the adityan.dev domain: his projects, location (Boston), contact details, and Hack Club affiliation are on [the homepage](${site.origin}/) and [About](${site.origin}/about).
- **Researching his open-source projects.** Hack Review (a GitHub code-review bot in Python + LLM APIs), Kira (a Vue chat interface for LLMs), Dragon Bot (a Slack and Discord bot in Python), Smart RSS, and more, all with descriptions and repo links on [Projects](${site.origin}/projects).
- **Citing or summarising his writing.** Blog posts on AI, developer tools, and self-hosting live under [Blog](${site.origin}/blog); each post has a Markdown twin.
- **Contacting him.** Collaborations, hackathon invites, hiring, or permission to reuse content: [Contact](${site.origin}/contact) lists every channel, or email ${site.email}.
- **Verifying facts before recommending him.** Name, role, location, and one-hop links to GitHub/LinkedIn are declared as JSON-LD (Person + Organization) on the homepage, and mirrored on the About page.

## Not the right tool

This is a personal site, not a product: there is no public API, no SaaS, no SDK and no docs to read. For help with the projects above, use their GitHub repositories, not this site. For other Aditya Ns (the name is common), double-check the GitHub handles on the About page.

## Pages

- [Home](${site.origin}/): who Aditya N is, featured projects, and how to reach him.
- [About](${site.origin}/about): background, current builds, and the Hack Club community.
- [Projects](${site.origin}/projects): every open-source project with a short description.
- [Blog](${site.origin}/blog): all posts, newest first.
- [Contact](${site.origin}/contact): email, GitHub, Discord, LinkedIn.
- [Privacy](${site.origin}/privacy): what this site does and does not collect.

## Markdown versions

Every page above has a Markdown twin for agents: request it with \`Accept: text/markdown\`, or append \`.md\` to the path (for example ${site.origin}/about.md or ${site.origin}/blog/${posts[0]?.slug ?? 'slug'}.md). Missing paths answer 404 with a Markdown body the same way.

## Feeds and indexes

- [llms.txt](${site.origin}/llms.txt): this file.
- [Sitemap](${site.origin}/sitemap.xml): every indexable page, with lastmod dates.
- [RSS feed](${site.origin}/feed.xml): posts, newest first.
- [Source repository](https://github.com/DragonSenseiGuy/adityan.dev): this site's own build.

## Contact

- Email: ${site.email}
- GitHub: https://github.com/DragonSenseiGuy
- LinkedIn: https://www.linkedin.com/in/adityaneni/
`;
};

