![adityan.dev preview](https://cdn.hackclub.com/019fa193-3397-794f-a2d9-e1f4ad4b660b/aga%205.png)

# adityan.dev

The source for my personal website and blog.

## Run locally

You will need [Node.js](https://nodejs.org/) and npm installed.

```bash
git clone https://github.com/DragonSenseiGuy/adityan.dev.git
cd adityan.dev
npm install
npm run dev
```

That builds the site and serves it at [http://localhost:3000](http://localhost:3000).
Re-run it after editing anything.

## How it is built

Everything under `dist/` is generated and nothing else is served, so `dist/` is
not committed. `npm run build` produces it:

| Source | Output |
| --- | --- |
| `src/pages/*.jsx` | `index.html`, `about.html`, `projects.html`, `blog.html`, `contact.html` — served as `/`, `/about`, `/projects`, `/blog`, `/contact` |
| `content/posts/*.md` | `blog/<slug>.html`, served as `/blog/<slug>`, and the post list on `/blog` |
| `src/data/*` | shared content: nav links, projects, site metadata |
| `src/pages/404.jsx`, `500.jsx` | the error pages nginx serves |
| `src/og/card.jsx`, `src/og/field.js` | `og/<page>.png` — one social card per page and post |
| `shaders/hero.wgsl` + `src/hero-canvas.js` | `hero-canvas.js` |
| the post dates | `sitemap.xml` and `feed.xml` |

Pages are written in JSX and share the nav, footer, `<head>` and section
components in `src/components`. The JSX is rendered to HTML strings at build
time by `src/jsx.js` — there is no client-side framework, and the deployed site
is plain static files. `scripts/build.mjs` runs the whole thing.

## Social cards

Every page and post gets its own Open Graph image, generated at build time:
[satori](https://github.com/vercel/satori) lays out `src/og/card.jsx` and resvg
rasterises it to a 1200x630 PNG in `dist/og/`. There is no image service — the
cards are static files like everything else, and a page picks up its own card
automatically because the path mirrors the page's (`/about` gets
`/og/about.png`).

The backdrop is the hero shader. `src/og/field.js` is `shaders/hero.wgsl`
rewritten in JS — the same warped fbm, the same iso-lines, the same edge
envelope — traced with marching squares into SVG paths, because satori cannot
run WebGPU. Each card seeds the field from its own title, so no two are the
same frame.

Cards come in two shapes:

- **Default** — wordmark, kicker, title, meta rule, and the `a_` monogram
  glowing on the right. Every static page gets this.
- **With an image** — the same left column, with the picture filling the right
  480px. Wide pictures (aspect over 1.2, so screenshots) are inset and framed
  instead of cropped to a tall slice.

### Changing a page's card

A page sets its card by exporting an `og` object next to its `element`:

```js
export const og = {
  kicker: 'About',                  // optional, small mono line above the title
  title: "Hi, I'm Aditya",          // required; the size steps down as it gets longer
  description: 'One line under the title', // optional
  meta: 'DragonSenseiGuy · dsg',    // the mono line under the rule
  image: 'content/images/about.png', // optional, switches to the image layout
};
```

### Changing a post's card

Posts build theirs from the title, description, date and tags. Two optional
frontmatter fields control it:

```
+++
title = "Post title"
description = "Shown under the title on the card."
image = "https://cdn.example.com/shot.png"
ogImage = "/og/custom/post.png"
+++
```

- `image` — the picture that goes **inside** the generated card. Either an
  absolute URL (fetched once at build time and inlined, so the card stays a
  static file) or a path relative to the repo root. PNG, JPEG and WebP are
  understood. If it cannot be loaded the build prints a warning and falls back
  to the monogram rather than failing.
- `ogImage` — a finished image that **replaces** the generated card entirely.
  No card is generated for that post. Absolute URLs are used as-is; a path like
  `/og/custom/post.png` gets the site origin prefixed, so put the file
  somewhere that gets copied into `dist/`.

Neither is required. Omit both and the post gets the monogram card.

### Previewing

`npm run build`, then open the PNGs in `dist/og/`. The `<meta>` tags that point
at them — `og:image`, `twitter:image` and their `alt` text — are written by
`Document` in `src/components/layout.jsx`; the URL itself is resolved by
`cardFor` in `src/data/site.js`.

## Writing a post

Add a Markdown file to `content/posts` with TOML frontmatter:

```
+++
title = "Post title"
description = "One line, used for the index, meta description and RSS."
date = 2025-11-07T08:14:00.000Z
tags = ["Python"]
image = "https://cdn.example.com/shot.png"
+++

Body goes here.
```

Then `npm run build`. The filename becomes the slug. `image` is optional and
only affects the social card — see [Social cards](#social-cards).

## Hero backdrop

Every page hero has a WebGPU backdrop: drifting contour lines from a warped
noise field, written in WGSL and rendered with [vgpu](https://vgpu.sh). The
feature size is derived from each hero's height, so a contour is the same size
on the tall homepage hero and on the short band above an interior page title.

A hero opts in with `data-hero-canvas="hero"`, `"page"` or `"contact"` on a
`canvas.hero-canvas` — the variant picks the feature size and how far back it
sits. It is decoration and it is optional: `script.js` only loads it on wide
screens, with WebGPU present, and when the visitor has not asked for reduced
motion.

## Deploying

The `Dockerfile` builds the site and serves `dist/` with nginx, including the
301 redirects in `nginx-redirects.conf` that map the old Hugo URLs onto the
current ones.

```bash
docker build -t adityan-dev .
docker run -p 8080:80 adityan-dev
```

## AI use
A significant portion of the codebase was written by AI, the blogs were written by me. I think AI is a great tool and i believe the output generated here is not *slop*.

## License

This project is available under the [MIT License](LICENSE).
