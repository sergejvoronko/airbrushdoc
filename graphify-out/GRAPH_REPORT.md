# Graph Report - .  (2026-06-21)

## Corpus Check
- 204 files · ~184,678 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 70 nodes · 79 edges · 12 communities (7 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Glossary Term Pages|Glossary Term Pages]]
- [[_COMMUNITY_Blog Post Rendering|Blog Post Rendering]]
- [[_COMMUNITY_Site Layout & Pages|Site Layout & Pages]]
- [[_COMMUNITY_Article Listing & Cards|Article Listing & Cards]]
- [[_COMMUNITY_Category Filter UI|Category Filter UI]]
- [[_COMMUNITY_Content Collections Config|Content Collections Config]]
- [[_COMMUNITY_Cookie Banner|Cookie Banner]]
- [[_COMMUNITY_Compare Tool|Compare Tool]]
- [[_COMMUNITY_Paint Selector Tool|Paint Selector Tool]]
- [[_COMMUNITY_Airbrush Quiz Tool|Airbrush Quiz Tool]]
- [[_COMMUNITY_Troubleshooter Tool|Troubleshooter Tool]]

## God Nodes (most connected - your core abstractions)
1. `../../layouts/BaseLayout.astro` - 23 edges
2. `../../layouts/PostLayout.astro` - 10 edges
3. `../components/ArticleCard.astro` - 6 edges
4. `../../components/NewsletterBox.astro` - 3 edges
5. `../components/RelatedPosts.astro` - 3 edges
6. `../components/CookieBanner.astro` - 2 edges
7. `../components/TOC.astro` - 2 edges
8. `string` - 1 edges
9. `dateStr` - 1 edges
10. `initials` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 5 thin omitted)

### Community 0 - "Glossary Term Pages"
Cohesion: 0.15
Nodes (9): categories, letters, sorted, string, breadcrumbSchema, definedTermSchema, related, string (+1 more)

### Community 1 - "Blog Post Rendering"
Cohesion: 0.15
Nodes (11): ../components/FAQ.astro, ../components/RelatedPosts.astro, scored, ../components/TOC.astro, filtered, ../../layouts/PostLayout.astro, articleSchema, breadcrumbSchema (+3 more)

### Community 2 - "Site Layout & Pages"
Cohesion: 0.18
Nodes (3): ../styles/global.css, ../../layouts/BaseLayout.astro, nav

### Community 3 - "Article Listing & Cards"
Cohesion: 0.29
Nodes (4): ../components/ArticleCard.astro, dateStr, initials, string

### Community 4 - "Category Filter UI"
Cohesion: 0.25
Nodes (7): cards, cats, countEl, noResults, number, sorted, string

### Community 5 - "Content Collections Config"
Cohesion: 0.40
Nodes (4): blog, collections, glossary, pages

## Knowledge Gaps
- **36 isolated node(s):** `string`, `dateStr`, `initials`, `../components/FAQ.astro`, `scored` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `../../layouts/BaseLayout.astro` connect `Site Layout & Pages` to `Glossary Term Pages`, `Blog Post Rendering`, `Article Listing & Cards`, `Category Filter UI`, `Cookie Banner`, `Homepage Index`, `Compare Tool`, `Paint Selector Tool`, `Airbrush Quiz Tool`, `Troubleshooter Tool`?**
  _High betweenness centrality (0.703) - this node is a cross-community bridge._
- **Why does `../../layouts/PostLayout.astro` connect `Blog Post Rendering` to `Site Layout & Pages`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `../components/ArticleCard.astro` connect `Article Listing & Cards` to `Category Filter UI`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `string`, `dateStr`, `initials` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._