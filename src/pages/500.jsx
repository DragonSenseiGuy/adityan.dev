import { Document } from '../components/layout.jsx';
import { Hero } from '../components/sections.jsx';
import { site } from '../data/site.js';

export const path = '/500';
export const noindex = true;

export const og = { kicker: '500', title: 'Something went wrong', meta: 'adityan.dev' };

export const element = (
  <Document
    path={path}
    title="Something went wrong 500"
    description="The server hit an error serving this page."
    noindex={noindex}
  >
    <main class="container">
      <Hero title="Something went wrong">
        <p class="lede">The server hit an error serving this page. Try again in a moment, and if it keeps happening, please contact me via email.</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="/">Go home</a>
          <a class="btn btn-ghost" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </Hero>
    </main>
  </Document>
);
