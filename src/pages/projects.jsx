import { Document } from '../components/layout.jsx';
import { Hero, SectionHead, WorkList, Closing } from '../components/sections.jsx';
import { featured, archive } from '../data/projects.js';
import { ogImageFor } from '../data/site.js';

// The project list, so search engines can read the repos as named items
// rather than as three anonymous links.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': 'https://adityan.dev/projects',
  name: 'Projects — Aditya N (DragonSenseiGuy)',
  url: 'https://adityan.dev/projects',
  author: { '@type': 'Person', name: 'Aditya N', url: 'https://adityan.dev/' },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [...featured, ...archive].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareSourceCode',
        name: item.name,
        description: item.desc,
        codeRepository: item.href,
        url: item.href,
        author: { '@type': 'Person', name: 'Aditya N' },
      },
    })),
  },
};

export const file = 'projects.html';

export const og = {
  kicker: 'Projects',
  title: "Things I've built in my free time",
  meta: 'Open source · github.com/DragonSenseiGuy',
};

export const element = (
  <Document
    title="Projects — Aditya N (DragonSenseiGuy)"
    description="Open-source projects by Aditya N (DragonSenseiGuy): AI developer tools, Slack bots, games, and self-hosted web apps."
    canonical="https://adityan.dev/projects"
    ogDescription="Open-source projects by Aditya N (DragonSenseiGuy): AI developer tools, Slack bots, and self-hosted web apps."
    twitterDescription="Open-source projects by Aditya N (DragonSenseiGuy): AI developer tools, Slack bots, and web apps."
    ogImage={ogImageFor(file)}
    ogImageAlt="Projects — Aditya N (DragonSenseiGuy)"
    jsonLd={jsonLd}
    current="/projects"
  >
    <main class="container">
      <Hero>
        <h1 id="page-title">Projects</h1>
        <p class="lede">Things I've built in my free time. Everything here is open source and lives on <a href="https://github.com/DragonSenseiGuy" target="_blank" rel="noopener">my GitHub</a>.</p>
      </Hero>

      <section aria-labelledby="featured-title">
        <SectionHead id="featured-title" title="Featured" />
        <WorkList items={featured} />
      </section>

      <section aria-labelledby="archive-title">
        <SectionHead id="archive-title" title="More work" />
        <WorkList items={archive} />
      </section>

      <Closing title="There's always more">
        <p>These are the ones that i'm proud of. These project will most likely be outdated though but I hope to regularly update them.</p>
        <a class="btn btn-solid" href="https://github.com/DragonSenseiGuy?tab=repositories" target="_blank" rel="noopener">Browse the repositories</a>
      </Closing>
    </main>
  </Document>
);
