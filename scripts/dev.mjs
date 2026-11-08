// Dev server. live-server on its own answers every unknown path with
// "Cannot GET /x", which hides the custom error pages and the 301s that nginx
// serves in production. This wraps it in a middleware that applies
// default.conf's try_files and the shared redirect table, so what you see
// locally is what the deployed site does.
//   node scripts/dev.mjs
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import liveServer from 'live-server';
import { acceptsMarkdown } from './negotiate.mjs';
import { mdFileFor, notFoundMarkdown } from './markdown.mjs';
import { site } from '../src/data/site.js';
import { matchers } from './redirects.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const isFile = (path) => existsSync(path) && statSync(path).isFile();

const wantsMarkdown = (req) => acceptsMarkdown(req.headers.accept);

// live-server would serve a .md file through its own static module; writing
// the response by hand sets the Markdown content type and lets the status
// match production (nginx gets its type from mime.types).
const serveMarkdown = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'text/markdown; charset=utf-8' });
  res.end(body);
};

// nginx serves an error page as the *body of the error*, so it keeps the error
// status. serve-static would send our 404.html with a 200; force the status
// back before the headers go out.
const withStatus = (res, status) => {
  const writeHead = res.writeHead;
  res.writeHead = function (code, ...rest) {
    return writeHead.call(this, code === 200 ? status : code, ...rest);
  };
};

const routes = (req, res, next) => {
  const url = new URL(req.url, 'http://localhost');
  const path = decodeURIComponent(url.pathname);

  for (const { pattern, to } of matchers) {
    if (!pattern.test(path)) continue;
    res.writeHead(301, { Location: path.replace(pattern, to) + url.search });
    return res.end();
  }

  // /404 and /500 aren't real routes in production — they're what nginx
  // returns for a missing page or a backend failure. Serve them here so the
  // pages can actually be previewed, with the status they'd really carry.
  // Markdown negotiators get the Markdown 404 body, like production does.
  const preview = path.match(/^\/(404|500)$/);
  if (preview) {
    if (preview[1] === '404' && wantsMarkdown(req)) return serveMarkdown(res, 404, notFoundMarkdown(site));
    req.url = `/${preview[1]}.html`;
    withStatus(res, Number(preview[1]));
    return next();
  }

  // Mirror default.conf's try_files $uri.$layout ...: an agent that asked for
  // text/markdown gets the page's .md twin when one exists, everyone else
  // falls through to HTML.
  if (wantsMarkdown(req) && isFile(join(dist, mdFileFor(path)))) {
    return serveMarkdown(res, 200, readFileSync(join(dist, mdFileFor(path))));
  }

  // Mirrors default.conf's `try_files $uri.html $uri`: prefer the .html file
  // on disk so a directory of the same name (dist/blog/) never shadows
  // dist/blog.html.
  const target = path === '/' ? '/index.html' : path;
  if (isFile(join(dist, `${target}.html`))) {
    req.url = `${target}.html`;
    return next();
  }
  if (isFile(join(dist, target))) return next();

  // A miss answers in the format the client asked for. Markdown responses are
  // sent by hand (live-server's static handler can't set the status we
  // preview); HTML keeps flowing through live-server so the page still gets
  // its livereload script.
  if (wantsMarkdown(req)) return serveMarkdown(res, 404, notFoundMarkdown(site));
  req.url = '/404.html';
  withStatus(res, 404);
  next();
};

liveServer.start({
  root: dist,
  port: Number(process.env.PORT) || 3000,
  open: false,
  middleware: [routes],
});
