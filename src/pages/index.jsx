import { Document } from '../components/layout.jsx';
import { Hero, SectionHead, WorkList, Closing } from '../components/sections.jsx';
import { ArrowRightIcon } from '../components/icons.jsx';
import { site, person, url } from '../data/site.js';
import { featured } from '../data/projects.js';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': url('/#website'),
      name: site.name,
      alternateName: ['DragonSenseiGuy', 'Dragon Sensei Guy'],
      url: url('/'),
      publisher: { '@id': url('/#person') },
    },
    { ...person, '@id': url('/#person') },
  ],
};

export const path = '/';

export const og = { title: 'Aditya N', meta: 'Student developer · Boston' };

export const element = (
  <Document
    path={path}
    title="Aditya N (DragonSenseiGuy) — Student Developer"
    description="Aditya N, also known as DragonSenseiGuy or Dragon Sensei Guy, is a student developer at Hack Club in Boston building AI tools, Slack bots, and self-hosted apps."
    ogDescription="Aditya N (DragonSenseiGuy / Dragon Sensei Guy), student developer at Hack Club building AI tools, Slack bots, and self-hosted apps."
    jsonLd={jsonLd}
  >
    <main class="container">
      <Hero variant="hero" title={'Aditya N'}>
        <p class="lede">i am a teenager and student developer in boston, building robots, tools, and websites with <a href="https://hackclub.com">hack club</a>. i work mostly in python and javascript. when i am off the clock i mess around with servers and build fun projects.</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="/projects">See my projects <ArrowRightIcon /></a>
          <a class="btn btn-ghost" href="/contact">Get in touch</a>
        </div>
      </Hero>

      <section aria-labelledby="featured-title">
        <SectionHead id="featured-title" title="Projects i've made">
          <p>Three projects i'm most proud of. The full list is on the <a href="/projects">projects page</a>.</p>
        </SectionHead>
        <WorkList items={featured} />
      </section>

      <section aria-labelledby="about-title">
        <div class="split">
          <div>
            <h2 class="section-title" id="about-title">About</h2>
          </div>
          <div class="prose">
            <p>i go by dragon or dsg around the internet. most of what i make exists because something annoyed me enough that i figured it would be cheaper for me to build it myself.</p>
            <p>i spend a lot of time in the hack club community, building things alongside other teenage makers. away from all that, i run a homelabs and agent servers off old laptops i have.</p>
            <p><a href="/about">More about me</a></p>
          </div>
        </div>
      </section>

      <Closing title="Let's build something">
        <p>Have an idea, a project, or just want to talk? My inbox is open.</p>
        <a class="btn btn-solid" href={`mailto:${site.email}`}>{site.email}</a>
      </Closing>
    </main>
  </Document>
);
