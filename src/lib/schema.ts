const SITE = 'https://airbrushdoc.com';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'AirbrushDOC',
  url: SITE,
  logo: { '@type': 'ImageObject', url: `${SITE}/images/airbrushdoc-logo.webp` },
};

const AUTHOR = { '@type': 'Person', name: 'AirbrushDOC', url: `${SITE}/about/` };

export interface ReviewItem {
  name: string;
  brand?: string;
  rating: number;
  priceLow?: number;
  priceHigh?: number;
  currency?: string;
  url?: string;
  verdict?: string;
}

function product(r: ReviewItem) {
  // Price range comes from the visible "Price: ~$X–$Y" line in the post, so the
  // markup matches on-page content. Deliberately no `availability` or `seller`:
  // stock is not tracked here and asserting it would be unverifiable.
  const offers =
    r.priceLow !== undefined
      ? {
          '@type': 'AggregateOffer',
          lowPrice: String(r.priceLow),
          ...(r.priceHigh !== undefined && { highPrice: String(r.priceHigh) }),
          priceCurrency: r.currency ?? 'USD',
        }
      : undefined;

  return {
    '@type': 'Product',
    name: r.name,
    ...(r.brand && { brand: { '@type': 'Brand', name: r.brand } }),
    ...(r.url && { url: r.url.startsWith('http') ? r.url : `${SITE}${r.url}` }),
    ...(offers && { offers }),
    review: {
      '@type': 'Review',
      author: AUTHOR,
      publisher: PUBLISHER,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(r.rating),
        bestRating: '5',
        worstRating: '1',
      },
      ...(r.verdict && { reviewBody: r.verdict }),
    },
  };
}

/**
 * One reviewed product -> a Review whose itemReviewed is the Product.
 * Several -> an ItemList of Products, which is the correct shape for a
 * "best X" roundup covering multiple distinct products on one page.
 */
export function buildReviewSchema(reviews: ReviewItem[], opts: { title: string; url: string }) {
  if (!reviews?.length) return null;

  if (reviews.length === 1) {
    const r = reviews[0];
    const { review, ...itemReviewed } = product(r);
    return {
      '@context': 'https://schema.org',
      ...review,
      itemReviewed,
      url: opts.url,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.title,
    url: opts.url,
    numberOfItems: reviews.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: reviews.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: product(r),
    })),
  };
}

export interface WebAppOpts {
  name: string;
  description: string;
  path: string;
  /** false only when access requires payment — an email gate is still free */
  free?: boolean;
  category?: string;
}

export function buildWebAppSchema({
  name,
  description,
  path,
  free = true,
  category = 'DesignApplication',
}: WebAppOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${SITE}${path}`,
    applicationCategory: category,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: free,
    // Only claim a price when the tool is genuinely free to use. Anything behind
    // the book is left without an Offer rather than priced at 0.
    ...(free && { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }),
    publisher: PUBLISHER,
  };
}

export interface BreadcrumbCrumb {
  name: string;
  /** Absolute path, e.g. "/tools/". Omit on the final (current) crumb. */
  path?: string;
}

/** BreadcrumbList mirroring the visible breadcrumb nav on a page. */
export function buildBreadcrumbSchema(crumbs: BreadcrumbCrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path && { item: `${SITE}${c.path}` }),
    })),
  };
}

/** FAQPage from question/answer pairs that are visible on the page. */
export function buildFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export interface BookOpts {
  name: string;
  description: string;
  url: string;
  image?: string;
  numberOfPages?: number;
  /** Undefined while the book is pre-launch — no Offer is emitted. */
  price?: string;
  currency?: string;
  available: boolean;
}

/**
 * Book + Offer for the paid edition. While `available` is false the book is
 * still a real work worth describing, but no Offer is emitted: advertising a
 * price for something that cannot be bought is exactly what Google treats as
 * an invalid offer.
 */
export function buildBookSchema(o: BookOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: o.name,
    description: o.description,
    url: o.url,
    ...(o.image && { image: o.image }),
    bookFormat: 'https://schema.org/EBook',
    inLanguage: 'en',
    author: AUTHOR,
    publisher: PUBLISHER,
    ...(o.numberOfPages && { numberOfPages: o.numberOfPages }),
    ...(o.available && o.price
      ? {
          offers: {
            '@type': 'Offer',
            price: o.price,
            priceCurrency: o.currency ?? 'USD',
            availability: 'https://schema.org/InStock',
            url: o.url,
          },
        }
      : {}),
  };
}

export interface GlossaryTerm {
  title: string;
  slug: string;
  description?: string;
}

/** DefinedTermSet for the A–Z glossary. */
export function buildGlossarySchema(terms: GlossaryTerm[], opts: { name: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: opts.name,
    url: opts.url,
    hasDefinedTerm: terms.map(t => ({
      '@type': 'DefinedTerm',
      name: t.title,
      ...(t.description && { description: t.description }),
      url: `${SITE}/airbrush-glossary/${t.slug}/`,
      inDefinedTermSet: opts.url,
    })),
  };
}
