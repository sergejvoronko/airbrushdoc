// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

const SITE_HOST = 'airbrushdoc.com';

// lastmod for the sitemap, from each article's updatedDate (else pubDate).
// Git dates are not usable: Cloudflare Pages builds from a shallow clone, so
// every file would report the build date. Category pages, /blog/ and the
// homepage take the date of their newest article. The IndexNow cron uses
// lastmod to decide which URLs changed.
const lastmod = new Map();
const newest = (key, d) => { if (!lastmod.has(key) || lastmod.get(key) < d) lastmod.set(key, d); };
for (const f of fs.readdirSync('./src/content/blog')) {
  if (!/\.mdx?$/.test(f)) continue;
  const fm = fs.readFileSync(path.join('./src/content/blog', f), 'utf8').split('---')[1] ?? '';
  if (/^draft:\s*true/m.test(fm)) continue;
  const ds = (fm.match(/^updatedDate:\s*"?([\d-]+)/m) ?? fm.match(/^pubDate:\s*"?([\d-]+)/m) ?? [])[1];
  if (!ds) continue;
  const d = new Date(ds);
  lastmod.set(`/blog/${f.replace(/\.mdx?$/, '')}/`, d);
  const category = (fm.match(/^category:\s*"?([\w-]+)/m) ?? [])[1];
  if (category) newest(`/${category}/`, d);
  newest('/blog/', d);
  newest('/', d);
}

// Zero-dependency rehype plugin: add rel/target to external links.
// nofollow + noopener on all external; sponsored on affiliate (Amazon) links.
function rehypeExternalLinks() {
  const isExternal = (href) => /^https?:\/\//i.test(href) && !href.includes(SITE_HOST);
  const isAffiliate = (href) => /amazon\.|amzn\.to|assoc-amazon/i.test(href);
  // /go/<slug> is an internal path but 302s straight to a merchant, so it is an
  // affiliate link and Google expects rel="sponsored" on it. The external test
  // above never matched these, which left 124 links across 29 articles unmarked.
  const isGoLink = (href) => /^\/go\//.test(href);
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties?.href;
      if (typeof href === 'string' && (isExternal(href) || isGoLink(href))) {
        const rel = new Set(['noopener', 'nofollow']);
        if (isAffiliate(href) || isGoLink(href)) rel.add('sponsored');
        node.properties.rel = [...rel].join(' ');
        node.properties.target = '_blank';
      }
    }
    if (node.children) node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://airbrushdoc.com',
  build: {
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      // /book/read is gated; /download/ 301s to /freebies/; /thank-you/ and the
      // two subscriber tools carry a noindex tag
      filter: (page) =>
        !page.includes('/book/read') &&
        !page.endsWith('/download/') &&
        !page.endsWith('/thank-you/') &&
        !page.endsWith('/tools/airmix/') &&
        !page.endsWith('/tools/troubleshooter/'),
      serialize(item) {
        const d = lastmod.get(new URL(item.url).pathname);
        if (d) item.lastmod = d.toISOString();
        return item;
      },
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeExternalLinks],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
