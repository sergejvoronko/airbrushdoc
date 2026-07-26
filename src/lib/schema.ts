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
