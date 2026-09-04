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

The site will be available at [http://localhost:3000](http://localhost:3000).

## Blog

The blog pages are generated from Markdown by `scripts/build-blog.js`. After configuring the post source directory in that script, rebuild them with:

```bash
npm run build:blog
```

## Hero backdrop

Every page hero has a WebGPU backdrop: drifting contour lines from a warped
noise field, written in WGSL and rendered with [vgpu](https://vgpu.sh). The
feature size is derived from each hero's height, so a contour is the same size
on the tall homepage hero and on the short band above an interior page title.
The
shader lives in `shaders/hero.wgsl` and the browser entry in `src/hero-canvas.js`;
`npm run build:shaders` flattens the WGSL imports and bundles both into the
committed `hero-canvas.js`, so the deployed site stays plain static files.

```bash
npm run build:shaders
```

A hero opts in with `data-hero-canvas="hero"` or `data-hero-canvas="page"` on a
`canvas.hero-canvas` — the variant picks the feature size and how far back it
sits. It is decoration and it is optional: `script.js` only loads it on wide screens,
with WebGPU present, and when the visitor has not asked for reduced motion.

## AI use
A significant portion of the codebase was written by AI, the blogs were written by me. I think AI is a great tool and i believe the output generated here is not *slop*.

## License

This project is available under the [MIT License](LICENSE).
