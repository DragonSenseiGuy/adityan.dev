import { Document } from '../components/layout.jsx';
import { Hero } from '../components/sections.jsx';
import { site, ogImageFor } from '../data/site.js';

export const file = '500.html';

export const og = { kicker: '500', title: 'Something went wrong', meta: 'adityan.dev' };

export const element = (
  <Document
    title="Something went wrong — Aditya N"
    description="The server hit an error serving this page."
    canonical="https://adityan.dev/500.html"
    ogImage={ogImageFor(file)}
    ogImageAlt="Something went wrong — Aditya N"
    noindex
    prefix="/"
  >
    <main class="container">
      <Hero>
        <h1 id="page-title">Something went wrong</h1>
        <p class="lede">The server hit an error serving this page. Try again in a moment, and if it keeps happening, please contact me via email.</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="/">Go home</a>
          <a class="btn btn-ghost" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </Hero>
    </main>
  </Document>
);
