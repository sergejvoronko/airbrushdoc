# airbrushdoc — Project Handover

Airbrush art publication. WordPress→Astro migration. Target: airbrushdoc.com (DNS cutover is the final launch step). Currently live at airbrushdoc.pages.dev (Cloudflare Pages).

## Stack & commands
- Astro static site, ~191 pages
- Build verify: `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`
- Deploy: push to GitHub `main` → Cloudflare Pages auto-deploy

## Hard holds — do not change
- `public/robots.txt`: keep `Disallow: /` for Googlebot + Bingbot until DNS is switched to airbrushdoc.com. Never change to `Allow: /` before cutover.
- `public/_headers`: keep `X-Robots-Tag: noindex, nofollow` until cutover. REMOVE at launch or live airbrushdoc.com gets deindexed.
- At cutover, BOTH must change together: remove robots Disallow blocks AND remove the noindex header line.

## Key sections
- `/blog/` (100+ articles), `/tools/` (6 interactive tools, iframe-embedded HTML in `public/tools/`), `/airbrush-glossary/`, `/book/`, freebies page

## Stencil creator architecture
- Single monolithic HTML file, separate mobile/desktop layouts (duplicate UI)
- Import-first UX: photo import visible immediately, no tabs; draw/shape tools collapsed secondary
- Multi-layer stencils: `S.nlayers` 1/2/3, thresholds `S.thr`/`S.thr2` partition luminosity ranges, each layer exports as separate PDF page; layer preview colors blue/red/green
- Cut SVG export (`expCutSVG`): imagetracerjs 2-color vectorization, white-fill paths stripped, one .svg per layer

## Gotchas
- Astro `<style>` blocks are page-scoped — shared CSS goes in `src/styles/global.css`; styles for JS-injected elements need `parent :global(.class)`
- MailerLite embeds need dark-theme override CSS (already in global.css)

## Pending pre-launch (see memory `project_airbrushdoc_tasks.md`)
17 tasks incl. image fixes, subscription gating, freebies page, editorial note cleanup, category rename, affiliate table; also tools polish, Remark42 comments, n8n automation, then DNS cutover.
