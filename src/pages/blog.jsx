import { Document } from '../components/layout.jsx';
import { Hero, PostList, Closing } from '../components/sections.jsx';
import { site, url } from '../data/site.js';
import { posts } from '../data/posts.js';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': url('/blog'),
  name: `Blog — ${site.name}`,
  description: site.feedDescription,
  url: url('/blog'),
  author: { '@type': 'Person', name: site.name, url: `${site.origin}/` },
  blogPost: posts.map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: post.url,
    mainEntityOfPage: post.url,
    keywords: post.tags,
  })),
};

export const path = '/blog';

export const og = { kicker: 'Blog', title: 'my thoughts on stuff.', meta: site.feedDescription };

export const element = (
  <Document
    path={path}
    title="Blog — Aditya N (DragonSenseiGuy)"
    description="Writing by Aditya N (DragonSenseiGuy): build logs, thoughts on AI and dev tools, and notes from a homelab."
    ogDescription="Build logs, thoughts on AI and dev tools, and the occasional rant on what's happening in the industry."
    jsonLd={jsonLd}
  >
    <main class="container">
      <Hero title="Blog">
        <p class="lede">my thoughts on stuff.</p>
      </Hero>

      <section aria-label="Posts">
        <PostList posts={posts} />
      </section>

      <Closing title="Read by email?">
        <p>New posts go out through my newsletter. No spam, just the writing.</p>
        <a class="btn btn-solid" href={site.substack} target="_blank" rel="noopener">Subscribe on Substack</a>
      </Closing>
    </main>
  </Document>
);
