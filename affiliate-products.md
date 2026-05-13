# AirbrushDOC — Affiliate Products Reference

Format: Amazon ASIN is enough to build a link: https://www.amazon.com/dp/{ASIN}/?tag=yourtagid-20
Or just paste the full Amazon URL — we'll extract ASIN automatically.

---

## Already live (/go/ redirects in _redirects)

| Slug | Product | Current URL |
|---|---|---|
| /go/3m-ultrafine | 3M Ultra Fine Scotch-Brite Pads | https://amzn.to/4sE64yL |
| /go/badger-stynylrez-primer | Badger Stynylrez Primer | https://amzn.to/46NUdpy |
| /go/vallejo-surface-primer | Vallejo Surface Primer | https://amzn.to/40SIP8p |
| /go/ak-interactive-gen-primer | AK Interactive Gen Primer | https://amzn.to/46Ryvkt |
| /go/citadel-spray-primers | Citadel Spray Primers | https://amzn.to/4bdWCLD |

---

## Needs links — Best Airbrush post (/blog/best-airbrush/)

| Product | Price Range | ASIN / Amazon URL | Notes |
|---|---|---|---|
| Iwata Neo CN | $65–$80 | | Budget pick #1 |
| Badger Patriot 105 | $90–$110 | | Budget pick #2 |
| Harder & Steenbeck Ultra | $95–$120 | | Budget pick #3 |
| Iwata HP-CS | $150–$175 | | Mid-range #1 (top rec) |
| Badger Renegade Krome | $140–$160 | | Mid-range #2 |
| H&S Infinity CR Plus | $180–$220 | | Mid-range #3 |
| Iwata Hi-Line HP-CH | $220–$260 | | Pro pick #1 |
| H&S Infinity Solo | $300–$360 | | Pro pick #2 |

---

## Needs links — Best Compressor post (/blog/best-air-compressor/)

| Product | Price Range | ASIN / Amazon URL | Notes |
|---|---|---|---|
| Master Airbrush TC-20 | $50–$65 | | Budget tankless |
| Badger Aspire TC909 | $90–$110 | | Reliable budget |
| Iwata-Medea IS 800 | $200–$240 | | Top rec (tank) |
| California Air Tools CAT-1P1060S | $180–$220 | | Quietest option |
| H&S Infinity Two in One | $240–$280 | | Premium European |
| Silentaire Sil-Air 50-24 | $450–$550 | | Professional |
| Moisture Trap with Regulator | $15–$30 | | Accessory |
| Braided Air Hose | $15–$25 | | Accessory |
| Quick-Disconnect Fittings | $8–$15 | | Accessory |
| Airbrush Holder/Stand | $10–$20 | | Accessory |

---

## Needs links — Upcoming draft articles

### Airbrush Cleaning Guide
| Product | Notes | ASIN / Amazon URL |
|---|---|---|
| Airbrush Cleaning Station | e.g. Paasche or generic | |
| Iwata Airbrush Cleaner | 16 oz bottle | |
| Medea Airbrush Cleaner | Alternative | |
| Master Airbrush Cleaning Kit | Budget option | |
| Ultrasonic Cleaner | Entry-level ~$35 | |
| Pipe cleaners / cleaning brushes | Generic | |

### Airbrush Kit Guide
| Product | Notes | ASIN / Amazon URL |
|---|---|---|
| Iwata Neo CN + IS-35 compressor kit | Starter bundle | |
| Master Airbrush G233 Kit | Budget kit | |
| Badger Patriot 105 + TC910 kit | Mid-range kit | |
| H&S Infinity + compressor kit | Premium kit | |

### Miniatures Guide
| Product | Notes | ASIN / Amazon URL |
|---|---|---|
| Iwata Hi-Line HP-AH | Fine detail .2mm | |
| Badger Krome | Mini painting | |
| H&S Infinity 0.15mm | Ultra-fine | |
| Vallejo Airbrush Flow Improver | Essential additive | |
| Vallejo Model Air (set) | Miniature paint set | |
| Citadel Air (set) | Warhammer paints | |

### T-Shirt Guide
| Product | Notes | ASIN / Amazon URL |
|---|---|---|
| Iwata Eclipse HP-CS | T-shirt workhorse | |
| Badger 105 Patriot | Good for textiles | |
| Createx Wicked Colors Set | Textile paints | |
| Jacquard Textile Colors | Alternative | |

### Cake Decorating
| Product | Notes | ASIN / Amazon URL |
|---|---|---|
| Master Airbrush G44K Food Kit | Food-safe kit | |
| PointZero Cake Airbrush Kit | Popular kit | |
| Chefmaster Food Coloring Set | Colors | |
| Wilton Color Mist | Ready-to-use | |

---

## How to add a link to a blog post

Once you have an ASIN or Amazon URL:

1. Decide if you want a `/go/` redirect (cleans URLs, tracks clicks) or a direct link.

**Option A — /go/ redirect** (recommended for affiliate links):
Add to `public/_redirects`:
```
/go/product-slug  https://www.amazon.com/dp/ASIN/?tag=yourtag-20  301
```
Then in the blog post markdown, use: `[Product Name](/go/product-slug)`

**Option B — direct link in markdown**:
`[Product Name](https://www.amazon.com/dp/ASIN/?tag=yourtag-20)`

---
*File: affiliate-products.md — update as you add real ASINs*
