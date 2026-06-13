#!/usr/bin/env node
// Rewrite legacy absolute WordPress URLs in blog markdown to current relative paths.
//   http(s)://(www.)airbrushdoc.com/<anything>/<slug>/  ->  /blog/<slug>/
// Only rewrites when <slug> matches an existing post in src/content/blog.
// Everything else (go/ redirects, wp-includes, unknown slugs) is left untouched
// and reported for manual review.
// DRY-RUN by default; pass --apply to write.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const BLOG = 'src/content/blog';

const slugs = new Set(
  readdirSync(BLOG).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
);

const URL_RE = /https?:\/\/(?:www\.)?airbrushdoc\.com\/([^\s)\]"'>]*)/g;

let rewritten = 0;
const unresolved = new Map();

for (const file of readdirSync(BLOG).filter(f => f.endsWith('.md'))) {
  const path = join(BLOG, file);
  const src = readFileSync(path, 'utf8');
  let changed = false;

  const out = src.replace(URL_RE, (match, pathPart) => {
    // strip trailing slash, take last segment as candidate slug
    const segs = pathPart.replace(/\/+$/, '').split('/').filter(Boolean);
    const slug = segs[segs.length - 1];
    if (slug && slugs.has(slug)) {
      rewritten++;
      changed = true;
      return `/blog/${slug}/`;
    }
    unresolved.set(match, (unresolved.get(match) || 0) + 1);
    return match;
  });

  if (changed && APPLY) writeFileSync(path, out);
}

console.log(`Rewritable (slug matches a post): ${rewritten}`);
console.log(`Unresolved (left as-is): ${[...unresolved.values()].reduce((a, b) => a + b, 0)} across ${unresolved.size} distinct URLs`);
console.log('\nTop unresolved URLs:');
[...unresolved.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  .forEach(([u, n]) => console.log(`  ${n}x  ${u}`));
console.log(APPLY ? '\nAPPLIED.' : '\nDRY-RUN. Re-run with --apply.');
