import { Document } from '../components/layout.jsx';
import { Hero } from '../components/sections.jsx';
import { ogImageFor, url } from '../data/site.js';

// Served by nginx from whatever URL missed, so every link is absolute.
export const file = '404.html';

export const og = { kicker: '404', title: 'Page not found', meta: 'adityan.dev' };

export const element = (
  <Document
    title="Page not found — Aditya N"
    description="That page does not exist on adityan.dev."
    canonical={url('/404')}
    ogImage={ogImageFor(file)}
    ogImageAlt="Page not found — Aditya N"
    noindex
    prefix="/"
  >
    <main class="container">
      <Hero>
        <h1 id="page-title">Page not found</h1>
        <p class="lede">That page doesn't exist, or it moved. While you're here, read my blog!</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="/">Go home</a>
          <a class="btn btn-ghost" href="/blog">Read the blog</a>
        </div>
      </Hero>
    </main>
  </Document>
);
