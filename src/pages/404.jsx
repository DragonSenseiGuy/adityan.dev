import { Document } from '../components/layout.jsx';
import { Hero } from '../components/sections.jsx';

// Served by nginx from whatever URL missed, so every link is absolute.
export const path = '/404';
export const noindex = true;

export const og = { kicker: '404', title: 'Page not found', meta: 'adityan.dev' };

export const element = (
  <Document
    path={path}
    title="Page not found — Aditya N"
    description="That page does not exist on adityan.dev."
    noindex={noindex}
  >
    <main class="container">
      <Hero title="Page not found">
        <p class="lede">That page doesn't exist, or it moved. While you're here, read my blog!</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="/">Go home</a>
          <a class="btn btn-ghost" href="/blog">Read the blog</a>
        </div>
      </Hero>
    </main>
  </Document>
);
