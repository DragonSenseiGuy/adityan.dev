# adityan.dev

This is the source code for my website

## Run it

`npm run build` - and you're done.

## Tests

`npm run test` - one build, then `node --test scripts/verify.mjs` pins the
agent-facing behaviour: every page's Markdown twin, the Markdown 404 body,
llms.txt (with its "when to use" guidance), the brand keywords and
Organization JSON-LD, the privacy page, and the nginx `default.conf` rules the
production image negotiates with.

## For agents

The site negotiates representations instead of shipping one copy for everyone:

- any page + `Accept: text/markdown` → the Markdown twin (`text/markdown`,
  `Vary: Accept`);
- every page also at `path.md`;
- missing paths answer 404 in Markdown when asked;
- `/llms.txt` is the machine-readable index, with a "When to use" section.

Production is the Docker image (`default.conf`); `npm run dev` replays the same
rules locally (`scripts/negotiate.mjs`). Vercel previews cannot negotiate
(static output) but the `.md` twins are there.

## License
MIT Licensed