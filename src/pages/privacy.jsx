import { Document } from '../components/layout.jsx';
import { Hero, SectionHead, Closing } from '../components/sections.jsx';
import { site, url } from '../data/site.js';

// Bumped whenever the copy stops matching reality; shown on the page.
export const policyDate = '2026-11-05';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': url('/privacy'),
  name: 'Privacy — Aditya N (DragonSenseiGuy)',
  url: url('/privacy'),
  dateModified: policyDate,
  publisher: { '@type': 'Person', name: site.name, url: `${site.origin}/` },
  about: { '@type': 'Thing', name: 'Privacy policy' },
};

export const path = '/privacy';

export const og = { kicker: 'Privacy', title: 'No tracking, no ads', meta: 'what this site collects' };

export const element = (
  <Document
    path={path}
    title="Privacy — Aditya N (DragonSenseiGuy)"
    description="The short privacy story of adityan.dev: no cookies, no analytics, no ads, no contact forms. The one preference is kept in your own browser."
    ogDescription="No cookies, no analytics, no ads, no contact forms."
    jsonLd={jsonLd}
  >
    <main class="container">
      <Hero title="Privacy">
        <p class="lede">The short version: this is a personal, mostly-static website. There is nothing to track you with — no cookies, no analytics, no ads, no contact forms. The only preference the site keeps is yours, in your own browser.</p>
      </Hero>

      <section aria-labelledby="what-is-stored-title">
        <div class="split">
          <div>
            <h2 class="section-title" id="what-is-stored-title">What is stored about you</h2>
          </div>
          <div class="prose">
            <p>One thing, and it never leaves your device: the light/dark theme choice. It is saved in your browser's <strong>localStorage</strong> under the key <code>theme</code>, so the site does not flash the other palette on your next visit. It is not a cookie, it is not sent to me or to anyone else, and clearing your browser storage removes it.</p>
            <p>That is the complete list. There is no login, no account, no form submission and no newsletter capture on <strong>adityan.dev</strong> itself.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="what-is-collected-title">
        <div class="split">
          <div>
            <h2 class="section-title" id="what-is-collected-title">What might be collected</h2>
          </div>
          <div class="prose">
            <p><strong>By me: nothing.</strong> I do not run any analytics or measurement scripts, and there are no third-party trackers on the pages.</p>
            <p><strong>By infrastructure:</strong> the site is served by nginx in front of Cloudflare. Like almost any server on the internet, Cloudflare keeps short-lived access logs (your IP address, user agent, and the pages requested) for security and abuse prevention, on their infrastructure, under their own policy. I do not read, export or analyse them.</p>
            <p><strong>By third parties you choose to visit:</strong> the pages load the Geist typefaces from Google Fonts, which means Google sees your IP when it serves the font files. Clicking through to GitHub, LinkedIn, my Substack, or any external link takes you to that company's terms, not to something I control.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="email-title">
        <div class="split">
          <div>
            <h2 class="section-title" id="email-title">Email</h2>
          </div>
          <div class="prose">
            <p>The contact page links to <strong>{site.email}</strong>. Emailing me is exactly like emailing anyone: what data you share in the message is up to your email provider and you. I do not add correspondents to any list.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="changes-title">
        <div class="split">
          <div>
            <h2 class="section-title" id="changes-title">Changes &amp; questions</h2>
          </div>
          <div class="prose">
            <p>This page is updated whenever the site starts or stops collecting something — currently that would be a big change, so you would hear about it here. This version was last updated <strong>{policyDate}</strong>.</p>
            <p>Any privacy question, dataset request, or "please delete my email from your inbox" goes to <strong>{site.email}</strong>. I'm one person; a human reads the replies.</p>
          </div>
        </div>
      </section>

      <Closing title="That's the whole thing">
        <p>Questions about any of this are always welcome.</p>
        <a class="btn btn-solid" href="/contact">Get in touch</a>
      </Closing>
    </main>
  </Document>
);
