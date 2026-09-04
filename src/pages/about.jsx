import { Document } from '../components/layout.jsx';
import { Hero, Closing } from '../components/sections.jsx';
import { person } from '../data/site.js';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    ...person,
    knowsAbout: ['AI developer tools', 'Slack bots', 'Self-hosting', 'Python', 'Vue', 'TypeScript', 'LLM APIs'],
  },
};

export const path = '/about';

export const og = { kicker: 'About', title: "Hi, I'm Aditya", meta: 'DragonSenseiGuy · dsg · dragon' };

export const element = (
  <Document
    path={path}
    title="About Aditya"
    description="About Aditya, also known as DragonSenseiGuy or dsg, a developer in Boston building AI developer tools and Slack bots."
    ogType="profile"
    ogDescription="Aditya , also known as DragonSenseiGuy or dsg, developer building AI developer tools and Slack bots."
    twitterDescription="Aditya , also known as DragonSenseiGuy or dsg, developer."
    jsonLd={jsonLd}
  >
    <main class="container">
      <Hero title="Hi, I'm Aditya">
        <p class="lede">Also known as <strong>DragonSenseiGuy</strong>, or dsg or dragon. I build websites and apps in my free time, mostly python and web dev.</p>
      </Hero>

      <section aria-label="Biography">
        <div class="split">
          <div>
            <h2 class="section-title">Background</h2>
          </div>
          <div class="prose">
            <p>Most of what I make exists because something else annoyed me, and I figured I could make it myself and make it better suited for myself. Much of it happens through <strong>Hack Club</strong>, a worldwide community of teenage makers</p>
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
