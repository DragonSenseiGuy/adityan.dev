import { Document } from '../components/layout.jsx';
import { Hero, Closing } from '../components/sections.jsx';
import { person, site, url } from '../data/site.js';

export const path = '/about';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': url(path),
  url: url(path),
  mainEntity: {
    ...person,
    knowsAbout: ['AI developer tools', 'Slack bots', 'Self-hosting', 'Python', 'Vue', 'TypeScript', 'LLM APIs'],
  },
};

export const og = { kicker: 'About', title: site.name, meta: 'DragonSenseiGuy · dsg · dragon' };

export const element = (
  <Document
    path={path}
    title={`About ${site.name} (DragonSenseiGuy) | ${site.brand}`}
    description={`Meet ${site.name}, the developer behind ${site.brand}, also known online as DragonSenseiGuy. Read about Aditya's background and what he's built.`}
    ogType="profile"
    ogImageAlt={`${site.brand} About card for ${site.name}, also known as DragonSenseiGuy`}
    jsonLd={jsonLd}
  >
    <main class="container">
      <Hero title={`Hi, I'm ${site.name}`}>
        <p class="lede">Also known as <strong>DragonSenseiGuy</strong>, or dsg or dragon. I build websites and apps in my free time, mostly python and web dev.</p>
      </Hero>

      <section aria-label="Biography">
        <div class="split">
          <div>
            <h2 class="section-title">Background</h2>
          </div>
          <div class="prose">
            <p>Most of what I make exists because something else annoyed me, and I figured I could make it myself and make it better suited for myself. Much of it happens through <strong>Hack Club</strong>, a worldwide community of makers</p>
            <p>Latest example: <a href="https://github.com/DragonSenseiGuy/hack-review" target="_blank" rel="noopener">Hack Review</a>. CodeRabbit charges for code review, so I built my own GitHub App that does it automatically. And <a href="https://github.com/DragonSenseiGuy/kira" target="_blank" rel="noopener">Kira</a>, a Vue chat app for language models, because I wanted the interface to look like how i wanted it to look.</p>
            <p>Away from AI, I just like messing around with servers. I run a homelab off an old laptop and built <a href="https://github.com/DragonSenseiGuy/smart-RSS" target="_blank" rel="noopener">Smart RSS</a>, a minimalist feed aggregator, to go with it (this project has now been sunset).</p>
          </div>
        </div>
      </section>

      <Closing title="Want the details?">
        <p>The projects page has more projects, and my GitHub has all of them.</p>
        <a class="btn btn-solid" href="/projects">See my projects</a>
      </Closing>
    </main>
  </Document>
);
