import { Document } from '../components/layout.jsx';
import { Hero, SectionHead } from '../components/sections.jsx';
import { site, socials, url } from '../data/site.js';

const channels = [
  { label: 'github', value: '@DragonSenseiGuy', href: socials.github },
  { label: 'discord', value: 'Message me', href: socials.discord },
  { label: 'linkedin', value: 'Aditya N', href: socials.linkedin },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': url('/contact'),
  name: 'Contact — Aditya N (DragonSenseiGuy)',
  url: url('/contact'),
  mainEntity: {
    '@type': 'Person',
    name: site.name,
    email: site.email,
    url: `${site.origin}/`,
    sameAs: [socials.github, socials.linkedin, socials.discord],
  },
};

export const path = '/contact';

export const og = { kicker: 'Contact', title: 'Say hello', meta: site.email };

export const element = (
  <Document
    path={path}
    title="Contact — Aditya N (DragonSenseiGuy)"
    description="Get in touch with Aditya N (DragonSenseiGuy / dsg) by email, GitHub, Discord, or LinkedIn."
    jsonLd={jsonLd}
  >
    <main class="container">
      <Hero variant="contact" title="Say hello">
        <p class="lede">Have an idea, a project, or just want to talk? My inbox is open. Email is the fastest way to reach me.</p>
        <a class="big-link" href={`mailto:${site.email}`}>{site.email}</a>
        <div class="hero-actions">
          <button class="btn btn-ghost" type="button" data-copy-email={site.email}><span data-copy-label>Copy address</span></button>
        </div>
      </Hero>

      <section aria-label="Other ways to reach me">
        <SectionHead title="Elsewhere" />
        <div class="channel-list">
          {channels.map((channel) => (
            <a class="channel" href={channel.href} target="_blank" rel="noopener">
              <span class="ch-label">{channel.label}</span>
              <span class="ch-value">{channel.value}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  </Document>
);
