// public/_redirects stays the source of truth for /go/ slugs: the n8n article
// writer reads it to decide which affiliate links exist. This turns those lines
// into a map the /go/ Function can import, since a Function on a path overrides
// _redirects for that path.
import { readFileSync, writeFileSync } from 'node:fs';

const links = {};
for (const line of readFileSync('public/_redirects', 'utf8').split('\n')) {
  const m = line.trim().match(/^\/go\/([A-Za-z0-9._-]+)\s+(\S+)(?:\s+(\d{3}))?$/);
  if (m) links[m[1]] = { url: m[2], status: Number(m[3] || 302) };
}
if (Object.keys(links).length === 0) throw new Error('no /go/ rules found in public/_redirects');
writeFileSync('src/data/go-links.json', JSON.stringify(links, null, 2) + '\n');
console.log(`go-links: ${Object.keys(links).length} slugs`);
