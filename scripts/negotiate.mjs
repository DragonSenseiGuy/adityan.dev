// Accept-header negotiation, shared by the dev middleware (scripts/dev.mjs)
// and the tests. Production nginx implements the same rule with
// `map $http_accept` blocks in default.conf — change both together.
//
// Only the real Media type 'text/markdown' triggers the Markdown copy, with
// word-boundary guards so 'text/markdown-x' or stray suffixes do not.
// A browser's 'text/html' or '*/*' keeps getting HTML.
export const acceptsMarkdown = (accept) => /\btext\/markdown(?![\w/-])/.test(accept || '');
