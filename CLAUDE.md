# airbrushdoc — Project Handover

Airbrush art publication. WordPress→Astro migration. Target: airbrushdoc.com (DNS cutover is the final launch step). Currently live at airbrushdoc.pages.dev (Cloudflare Pages).

## Stack & commands
- Astro static site, ~191 pages
- Build verify: `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`
- Deploy: push to GitHub `main` → Cloudflare Pages auto-deploy

## Launch status
Cutover is DONE. airbrushdoc.com is live and indexed (189/193 URLs "Submitted and indexed",
verified via the GSC URL Inspection API on 2026-09-04). The old pre-cutover holds are lifted:
`robots.txt` is `Allow: /` and the `X-Robots-Tag: noindex` line is gone from `public/_headers`.
Do not reinstate either.

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

## Merch pipeline (Printify -> Etsy)
- Etsy shop `AirbrushDOC`, Printify shop id **28918369**; token in `airbrushdoc-assets/.env` and n8n env
- n8n: `Merch Generator` (webhook `airbrushdoc-merch-generate`) -> Telegram approve -> `Merch Create` -> Telegram publish button
- Concept queue: `stacks/n8n/drafts/airbrushdoc/merch-concept.json`; `merch-draft.json` is the pending gate
- Image rules live in `stacks/n8n/tools/merchprep.js`, not in prompts:
  - Gemini never emits alpha; generate on flat black, key from the brightest channel
  - trim transparent padding before upload or Printify shrinks the print
  - `scale` must be computed from art vs print-area aspect, never left at 1 (width-fit crops the overflow)
  - dark garments only; a white variant makes light-on-transparent art vanish
  - Etsy tags: 13 max, 20 chars each, silently dropped otherwise
- `node scripts/sync-merch.mjs` writes `src/data/merch.json` from products that are actually live on Etsy
