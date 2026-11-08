// Accept-header negotiation. One rule, one place.
//
// Only the real media type 'text/markdown' hands out the Markdown copies, with
// word-boundary guards so 'text/markdown-x' or stray suffixes do not. A
// browser's 'text/html' or '*/*' keeps getting HTML.
//
// Consumers:
//   - scripts/dev.mjs calls acceptsMarkdown() per request;
//   - scripts/build.mjs writes the nginx maps from MARKDOWN (ngConf() below)
//     to nginx-negotiate.conf, which the Dockerfile puts in conf.d before
//     default.conf reads $layout and $notfound;
//   - scripts/verify.mjs pins both consumers against MARKDOWN.
export const MARKDOWN = '\\btext\\/markdown(?![\\w/-])';

const wantsMarkdown = new RegExp(MARKDOWN, 'i');

export const acceptsMarkdown = (accept) => wantsMarkdown.test(accept || '');

// The two nginx map blocks that turn Accept into the extension try_files
// prefers ($layout) and the 404 body that matches it ($notfound). maps live at
// http{} level, where the image's conf.d glob includes them.
export const ngConf = () => `map $http_accept $layout {
    default html;
    "~*${MARKDOWN}" md;
}

map $http_accept $notfound {
    default /404.html;
    "~*${MARKDOWN}" /404.md;
}
`;
