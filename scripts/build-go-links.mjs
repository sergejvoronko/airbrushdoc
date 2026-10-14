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

// Merch "Buy on Etsy" buttons go through /go/merch-<design> so the same Function
// counts them. Kept out of _redirects on purpose: the article writer treats every
// slug there as an affiliate product it may link to.
const listings = new Map(JSON.parse(readFileSync('src/data/merch.json', 'utf8')).map((p) => [p.id, p.url]));
for (const d of JSON.parse(readFileSync('src/data/merch-designs.json', 'utf8'))) {
  const url = listings.get(d.productId);
  if (url) links[merchSlug(d.slug)] = { url, status: 302 };
  for (const [label, id] of Object.entries(d.buy || {})) {
    if (id !== d.productId && listings.has(id)) links[merchSlug(d.slug, label)] = { url: listings.get(id), status: 302 };
  }
}

// SprayGunner alternatives go through /go/sg-<amazon slug>: the sg- prefix is how
// the dashboard tells the two stores apart, and the rehype plugin in
// astro.config.mjs adds the second link next to the Amazon one. Kept out of
// _redirects for the same reason as merch.
const SG_REF = 'VkROcW1ulb';
for (const [slug, path] of Object.entries(JSON.parse(readFileSync('src/data/spraygunner.json', 'utf8')))) {
  if (slug.startsWith('_')) continue;
  if (!links[slug]) throw new Error(`spraygunner.json: no Amazon /go/${slug} to pair with`);
  links[`sg-${slug}`] = { url: `https://spraygunner.com/${path}?bg_ref=${SG_REF}`, status: 302 };
}

// Keep in step with goHref in src/pages/merch/index.astro.
function merchSlug(designSlug, label) {
  const base = `merch-${designSlug.replace(/^\d+-/, '')}`;
  return label ? `${base}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : base;
}
writeFileSync('src/data/go-links.json', JSON.stringify(links, null, 2) + '\n');
console.log(`go-links: ${Object.keys(links).length} slugs`);
