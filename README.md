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

## AI use
A significant portion of the codebase was written by AI, the blogs were written by me. I think AI is a great tool and i believe the output generated here is not *slop*.

## License

This project is available under the [MIT License](LICENSE).
