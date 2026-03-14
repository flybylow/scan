# PRD: QR/Barcode Scanner — prodlist_triple

**Project:** prodlist_triple  
**Author:** Ward De Muynck, Tabulas  
**Date:** 14 March 2026  
**Status:** Ready for development

---

## Overview

Add a camera-based QR and barcode scanner to the prodlist_triple Next.js app. When a product barcode is scanned, the app extracts the GTIN, queries `products.ttl` via Comunica, and displays the matching product data as a graph and detail view.

---

## Goal

Demonstrate the full open standards DPP flow:

```
Physical product → scan barcode → extract GTIN → SPARQL query on .ttl → graph visualization
```

No database. No API. Just a camera, a Turtle file, and a query engine.

---

## User Story

As a user, I open the app, tap "Scan", point my camera at a product barcode, and instantly see that product's triples visualized as a graph with all its DPP data.

---

## Scope

### In scope
- EAN-13 barcode scanning (standard supermarket barcodes)
- QR code scanning
- GTIN extraction from scan result
- Comunica SPARQL lookup in `public/products.ttl`
- Product detail view showing all triples
- Graph visualization of the product node and its edges
- "Not found" state when GTIN is not in the dataset

### Out of scope
- GS1 Digital Link QR codes (future)
- Multi-product scanning session
- Saving scan history
- Camera permission error handling beyond basic messaging

---

## Technical Approach

### Scanning library
Use `@zxing/browser` for barcode and QR scanning via the device camera.

```bash
npm install @zxing/browser @zxing/library
```

This works in the browser without React Native. No app store needed.

### GTIN lookup
Extract the numeric GTIN from the scan result, then query `products.ttl`:

```sparql
PREFIX gs1: <https://www.gs1.org/voc/>
PREFIX schema: <https://schema.org/>
PREFIX dpp: <https://tabulas.eu/vocab/dpp#>

SELECT * WHERE {
  ?product gs1:gtin "SCANNED_GTIN" ;
           schema:name ?name ;
           schema:brand ?brand ;
           dpp:nutriscoreGrade ?nutriscore ;
           dpp:ecoscoreGrade ?ecoscore .
}
LIMIT 1
```

Source: `file:///public/products.ttl` in development, `/products.ttl` when hosted on Vercel.

### Graph visualization
Reuse `react-force-graph-3d` already installed. Map all triples for the matched product into nodes and links.

---

## File Structure

```
prodlist_triple/
├── app/
│   ├── page.tsx              # Home, shows Scan button
│   └── scan/
│       └── page.tsx          # Scanner view
├── components/
│   ├── Scanner.tsx           # Camera + ZXing scanning logic
│   ├── ProductGraph.tsx      # Graph visualization
│   └── ProductDetail.tsx     # Flat list of all triples
├── lib/
│   └── queryProduct.ts       # Comunica SPARQL lookup by GTIN
└── public/
    └── products.ttl          # Data source
```

---

## Components

### Scanner.tsx
- Opens device camera using ZXing `BrowserMultiFormatReader`
- Decodes EAN-13 and QR codes continuously
- On successful decode: stops camera, extracts GTIN, calls `queryProduct(gtin)`
- Shows scanning overlay with targeting frame
- Mobile-first, full screen

### queryProduct.ts
- Takes a GTIN string
- Queries `products.ttl` via Comunica `QueryEngine`
- Returns product object or `null` if not found
- Caches the engine instance to avoid re-initializing on every scan

### ProductGraph.tsx
- Takes product URI
- Runs a second query to fetch all triples for that URI
- Maps to `{ nodes, links }` for react-force-graph-3d
- Each predicate becomes a labeled edge

### ProductDetail.tsx
- Simple card showing: name, brand, nutriscore, ecoscore, NOVA group, allergens, packaging materials, categories
- "Back to scanner" button

---

## States

| State | Description |
|---|---|
| `idle` | Home screen, Scan button visible |
| `scanning` | Camera open, scanning in progress |
| `loading` | Barcode found, querying .ttl |
| `found` | Product matched, show graph + detail |
| `not_found` | GTIN not in products.ttl, show message |
| `error` | Camera permission denied or device not supported |

---

## Acceptance Criteria

- Scanning an EAN-13 barcode on a food product returns the correct product within 2 seconds
- Products not in the dataset show a clear "not found" message
- Graph renders within 1 second of product being found
- Works on Chrome (desktop) and Safari (iOS)
- No server required, runs fully on `localhost:3000`

---

## Notes for Developer

- ZXing must be loaded client-side only. Use `dynamic(() => import(...), { ssr: false })` for the Scanner component.
- **Comunica in the browser:** Do not use `@comunica/query-sparql-file` (Node.js `fs`). Use `@comunica/query-sparql` with `fetch('/products.ttl').then(r => r.text())` and pass the string as a source with `type: "serialized"`, `mediaType: "text/turtle"`, `baseIRI`. See `docs/learned.md` (Comunica section).
- `products.ttl` is in `/public`; in browser and on Vercel the source URL is `/products.ttl`.
- **Camera:** Requires a secure context (HTTPS or localhost). On Vercel the app is HTTPS so the scanner works on mobile. See `docs/mobile-testing.md` for local HTTPS/tunnel options.
- Test GTINs available in the dataset: `3274080005003` (Cristaline water), `7622210449283` (Prince biscuit), `3017620425035` (Nutella).
