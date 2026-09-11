// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_HOST = 'airbrushdoc.com';

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
      // /book/read is gated; /download/ 301s to /freebies/; /thank-you/ carries a noindex tag
      filter: (page) =>
        !page.includes('/book/read') &&
        !page.endsWith('/download/') &&
        !page.endsWith('/thank-you/'),
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
