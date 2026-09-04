// sitemap.xml and the RSS feed, both generated from the same page/post data.
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// lastmod is only emitted where a real date exists; a build timestamp on every
// page would just tell crawlers the whole site changed each deploy.
export function sitemap({ pages, posts }) {
  const urls = [
    ...pages.map((page) => ({ loc: page.loc, lastmod: page.lastmod })),
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
