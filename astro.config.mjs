// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_HOST = 'airbrushdoc.com';

// Zero-dependency rehype plugin: add rel/target to external links.
// nofollow + noopener on all external; sponsored on affiliate (Amazon) links.
function rehypeExternalLinks() {
  const isExternal = (href) => /^https?:\/\//i.test(href) && !href.includes(SITE_HOST);
  const isAffiliate = (href) => /amazon\.|amzn\.to|assoc-amazon/i.test(href);
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties?.href;
      if (typeof href === 'string' && isExternal(href)) {
        const rel = new Set(['noopener', 'nofollow']);
        if (isAffiliate(href)) rel.add('sponsored');
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
  integrations: [sitemap({ filter: (page) => !page.includes('/book/read') })],
  markdown: {
    rehypePlugins: [rehypeExternalLinks],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
