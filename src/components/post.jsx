import { raw } from '../jsx.js';
import { cardFor, person, url } from '../data/site.js';
import { Document } from './layout.jsx';
import { formatDate } from './sections.jsx';

// The card's copy. `image` is filled in by the build, which loads the file
// the frontmatter names; without one the card falls back to the monogram.
export const postOg = (post, image = null) => ({
  kicker: 'Blog',
  title: post.title,
  description: post.description || '',
  meta: [formatDate(post.date), ...(post.tags || [])].join(' · '),
  image,
});

export function PostPage({ post }) {
  const path = `/blog/${post.slug}`;
  const card = cardFor(post, path);
  const canonical = url(path);
  const author = {
    '@id': person['@id'],
    '@type': person['@type'],
    name: person.name,
    url: person.url,
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description || '',
    datePublished: post.date,
    dateModified: post.date,
    url: canonical,
    mainEntityOfPage: canonical,
    keywords: post.tags || [],
    image: card,
    inLanguage: 'en',
    isPartOf: { '@type': 'Blog', '@id': url('/blog') },
    author: { ...author, alternateName: person.alternateName },
    publisher: author,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: url('/') },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: url('/blog') },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  };

  return (
    <Document
      path={path}
      title={`${post.title} — Aditya N`}
      description={post.description || ''}
      ogType="article"
      ogImage={card}
      ogImageAlt={post.title}
      articleDate={post.date}
      jsonLd={jsonLd}
      current="/blog"
    >
      <main class="container">
        <article class="article">
          <p><a href="/blog" class="back-link">← Blog</a></p>
          <h1 class="article-title">{post.title}</h1>
          <div class="article-meta">
            <time datetime={post.date}>{formatDate(post.date)}</time>
            {post.tags && post.tags.length > 0 && (
              <span class="post-tags">{post.tags.map((tag) => <span>{tag}</span>)}</span>
            )}
          </div>
          <div class="prose article-body">{raw(`\n${post.html}\n      `)}</div>
          <p class="article-foot"><a href="/blog" class="back-link">← Back to all posts</a></p>
        </article>
      </main>
    </Document>
  );
}
