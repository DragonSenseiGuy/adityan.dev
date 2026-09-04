import { raw } from '../jsx.js';
import { ogImageFor } from '../data/site.js';
import { Document } from './layout.jsx';
import { formatDate } from './sections.jsx';

export const postOg = (post) => ({
  kicker: 'Blog',
  title: post.title,
  meta: [formatDate(post.date), ...(post.tags || [])].join(' · '),
});

export function PostPage({ post }) {
  const file = `blog/${post.slug}.html`;
  const canonical = `https://adityan.dev/${file}`;
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
    image: ogImageFor(file),
    inLanguage: 'en',
    isPartOf: { '@type': 'Blog', '@id': 'https://adityan.dev/blog.html' },
    author: {
      '@type': 'Person',
      name: 'Aditya N',
      alternateName: ['DragonSenseiGuy', 'Dragon Sensei Guy'],
      url: 'https://adityan.dev/',
    },
    publisher: { '@type': 'Person', name: 'Aditya N', url: 'https://adityan.dev/' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://adityan.dev/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://adityan.dev/blog.html' },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  };

  return (
    <Document
      title={`${post.title} — Aditya N`}
      description={post.description || ''}
      canonical={canonical}
      ogType="article"
      ogImage={ogImageFor(file)}
      ogImageAlt={post.title}
      articleDate={post.date}
      jsonLd={jsonLd}
      prefix="../"
      current="blog.html"
    >
      <main class="container">
        <article class="article">
          <p><a href="../blog.html" class="back-link">← Blog</a></p>
          <h1 class="article-title">{post.title}</h1>
          <div class="article-meta">
            <time datetime={post.date}>{formatDate(post.date)}</time>
            {post.tags && post.tags.length > 0 && (
              <span class="post-tags">{post.tags.map((tag) => <span>{tag}</span>)}</span>
            )}
          </div>
          <div class="prose article-body">{raw(`\n${post.html}\n      `)}</div>
          <p class="article-foot"><a href="../blog.html" class="back-link">← Back to all posts</a></p>
        </article>
      </main>
    </Document>
  );
}
