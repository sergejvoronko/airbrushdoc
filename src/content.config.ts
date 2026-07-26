import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    category: z.string().default('general'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    // Products reviewed in the post, used to emit Review / ItemList markup.
    // Declared here rather than parsed out of the prose so it stays accurate
    // and the ratings are always the author's, never inferred.
    reviews: z.array(z.object({
      name: z.string(),
      brand: z.string().optional(),
      rating: z.number().min(1).max(5),
      priceLow: z.number().optional(),
      priceHigh: z.number().optional(),
      currency: z.string().default('USD'),
      url: z.string().optional(),
      verdict: z.string().optional(),
    })).optional(),
    wpId: z.number().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.string().default('general'),
    description: z.string().optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog, pages, glossary };
