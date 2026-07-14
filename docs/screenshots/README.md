# Screenshots

The main [`README.md`](../../README.md) gallery references the six images below. The committed
`*.svg` files are **labeled placeholders** so the gallery renders cleanly until you add real
screenshots.

## How to add real screenshots

1. Capture each screen (PNG, ~1280×720 or wider looks best).
2. Save it into this folder using the **same base name** as the placeholder, e.g.
   `01-dashboard.png`.
3. In [`README.md`](../../README.md), change that image's extension from `.svg` to `.png`
   (or delete the `.svg` and keep the name consistent). PNG/JPG/WebP all render on GitHub.

| File | Screen | What to show |
| --- | --- | --- |
| `01-dashboard` | Dashboard & KPIs | The main dashboard — metric cards, exception tiles, charts |
| `02-orders` | Orders & Purchase Orders | The orders list and/or a single PO with lines |
| `03-costing` | Costing & Margin Control | A costing sheet with cost items and the computed margin |
| `04-critical-path` | Time & Action / Critical Path | Milestones / T&A view with due dates |
| `05-shipment` | Shipment & QC | A shipment with lines, telex/commission columns |
| `06-reports` | Finance, Reports & Audit Trail | A report (e.g. Shipped Goods) or the audit log |

## ⚠️ Keep screenshots client-neutral

This repository is public. Before committing screenshots:

- **Remove or blur client branding** (company name, logo) and any live client URL.
- **Replace real data** with demo/sample values where practical (buyer names, factory names,
  prices, invoice numbers).
- Prefer capturing against a **seeded demo tenant** rather than production data.

A quick way to get clean shots is to run the app locally with the seeded demo company and a
generic brand, then capture each screen.
