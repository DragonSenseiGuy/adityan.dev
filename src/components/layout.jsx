import { raw } from '../jsx.js';
import { site, socials, navLinks } from '../data/site.js';
import {
  GitHubIcon, LinkedInIcon, DiscordIcon, MoonIcon, SunIcon,
} from './icons.jsx';

const FAVICON =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.78em' font-size='84' font-family='monospace' fill='%23ededed'>a_</text></svg>";

// Runs before first paint so a stored theme never flashes the other one.
const THEME_SCRIPT = `
    (function () {
      try {
        var t = localStorage.getItem('theme');
        if (t !== 'light' && t !== 'dark') {
          t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        document.documentElement.dataset.theme = t;
      } catch (e) {}
    })();
  `;

function Nav({ prefix = '', current }) {
  // The error pages are served from whatever URL 404'd, so they set prefix to
  // an absolute '/' — where the home link is the root itself.
  const home = prefix === '/' ? '/' : `${prefix}index.html`;
  return (
    <header class="site-nav">
      <div class="nav-inner">
        <a class="brand" href={home}>adityan<span class="tld">.dev</span></a>
        <nav class="nav-links" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => (
            <a href={`${prefix}${href}`} aria-current={href === current ? 'page' : null}>{label}</a>
          ))}
        </nav>
        <button class="theme-toggle" type="button" aria-label="Toggle color theme">
          <MoonIcon />
          <SunIcon />
        </button>
      </div>
    </header>
  );
}

function Socials() {
  return (
    <div class="socials">
      <a href={socials.github} aria-label="GitHub" target="_blank" rel="noopener"><GitHubIcon /></a>
      <a href={socials.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener"><LinkedInIcon /></a>
      <a href={socials.discord} aria-label="Discord" target="_blank" rel="noopener"><DiscordIcon /></a>
    </div>
  );
}

function Footer() {
  return (
    <footer class="site-footer">
      <div class="container">
        <div class="footer-inner">
          <div>
            <p class="footer-name">{site.name}</p>
          </div>
          <Socials />
        </div>
        <div class="footer-bottom">
          <span>{'© '}<span data-year>2026</span>{` ${site.name}`}</span>
          <a href={site.repo} target="_blank" rel="noopener">Open source on GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export function Document({
  title,
  description,
  canonical,
  ogType = 'website',
  ogTitle = title,
  ogDescription = description,
  twitterTitle = ogTitle,
  twitterDescription = ogDescription,
  ogImage,
  ogImageAlt,
  articleDate,
  jsonLd,
  noindex = false,
  prefix = '',
  current,
  children,
}) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="author" content={site.name} />
        {/* Let Google use full-size image previews and untruncated snippets. */}
        <meta
          name="robots"
          content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
        />
        {!noindex && <link rel="canonical" href={canonical} />}
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content={site.name} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogImageAlt} />
        {articleDate && (
          <Fragment>
            <meta property="article:published_time" content={articleDate} />
            <meta property="article:author" content={site.name} />
          </Fragment>
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={twitterTitle} />
        <meta name="twitter:description" content={twitterDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogImageAlt} />
        <link rel="icon" href={FAVICON} />
        <script>{raw(THEME_SCRIPT)}</script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400..500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href={`${prefix}styles.css`} />
        <link rel="alternate" type="application/rss+xml" title={`${site.name} — Blog`} href={`${site.origin}/feed.xml`} />
        {jsonLd && (
          <script type="application/ld+json">{raw(`\n${JSON.stringify(jsonLd, null, 2)}\n  `)}</script>
        )}
      </head>
      <body>
        <Nav prefix={prefix} current={current} />
        {children}
        <Footer />
        <script src={`${prefix}script.js`}></script>
      </body>
    </html>
  );
}
