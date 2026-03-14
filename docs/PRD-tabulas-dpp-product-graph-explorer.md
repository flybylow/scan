# PRD: Tabulas DPP Product Graph Explorer

## Context
Standalone Next.js app that loads a Turtle (RDF) file of 1000 food products, queries it with Comunica SPARQL, and visualizes the results as an interactive 3D force graph. No backend, no database. Pure open standards demo.

## Stack
- Next.js 15 (App Router, TypeScript, Tailwind)
- `@comunica/query-sparql` for SPARQL queries against the TTL file loaded via fetch
- `react-force-graph-3d` for 3D graph visualization
- `products.ttl` is already in `/public/products.ttl`

## Install the correct Comunica package first
```bash
npm install @comunica/query-sparql
```
(react-force-graph-3d is already installed)

## RDF Prefixes used in products.ttl
```
schema: https://schema.org/
dpp:    https://tabulas.eu/vocab/dpp#
gs1:    https://www.gs1.org/voc/
xsd:    http://www.w3.org/2001/XMLSchema#
```

## Data shape of each product in products.ttl
```turtle
<https://tabulas.eu/product/{gtin}>
    a schema:Product, gs1:Product ;
    schema:name "Product Name" ;
    schema:brand "Brand Name" ;
    gs1:gtin "1234567890123" ;
    gs1:netContent "500 g" ;
    schema:image <https://...jpg> ;
    dpp:nutriscoreGrade "A" ;
    dpp:ecoscoreGrade "B" ;
    dpp:novaGroup "1"^^xsd:integer ;
    dpp:containsAllergen "gluten" ;
    dpp:packagingMaterial "plastic" ;
    schema:category "snacks" ;
    schema:areaServed "belgium" ;
    dpp:status "unclaimed" ;
    dpp:fetchedAt "2026-02-14T22:51:50.842Z"^^xsd:dateTime .
```

## App Structure
```
app/
  page.tsx              # root page, loads ProductGraph with ssr:false
  layout.tsx            # default, black background
components/
  ProductGraph.tsx      # main component, all logic here
  FilterPanel.tsx       # sidebar filters
public/
  products.ttl          # already in place, 826KB
```

## How to load the TTL in the browser (important)
Do NOT use @comunica/query-sparql-file — that uses Node.js fs and won't work client-side.
Use this pattern instead:

```ts
import { QueryEngine } from '@comunica/query-sparql';

const engine = new QueryEngine();
const turtleText = await fetch('/products.ttl').then(r => r.text());

const bindingsStream = await engine.queryBindings(query, {
  sources: [{
    type: 'stringSource',
    value: turtleText,
    mediaType: 'text/turtle',
    baseIRI: 'https://tabulas.eu/'
  }]
});
```

## SPARQL queries (use full URIs, not prefixes)

### Main query (on load)
```sparql
SELECT ?product ?name ?brand ?ecoscore ?nutriscore ?category WHERE {
  ?product a <https://schema.org/Product> ;
           <https://schema.org/name> ?name ;
           <https://schema.org/brand> ?brand ;
           <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;
           <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore .
  OPTIONAL { ?product <https://schema.org/category> ?category . }
}
LIMIT 50
```

### Detail query (on node click, replace PRODUCT_URI with clicked node id)
```sparql
SELECT ?name ?brand ?gtin ?image ?ecoscore ?nutriscore ?nova ?allergen ?packaging ?status WHERE {
  <PRODUCT_URI> <https://schema.org/name> ?name ;
                <https://schema.org/brand> ?brand ;
                <https://www.gs1.org/voc/gtin> ?gtin ;
                <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;
                <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore ;
                <https://tabulas.eu/vocab/dpp#status> ?status .
  OPTIONAL { <PRODUCT_URI> <https://schema.org/image> ?image . }
  OPTIONAL { <PRODUCT_URI> <https://tabulas.eu/vocab/dpp#novaGroup> ?nova . }
  OPTIONAL { <PRODUCT_URI> <https://tabulas.eu/vocab/dpp#containsAllergen> ?allergen . }
  OPTIONAL { <PRODUCT_URI> <https://tabulas.eu/vocab/dpp#packagingMaterial> ?packaging . }
}
```

## Graph data shape for react-force-graph-3d
Transform SPARQL results into:
```ts
{
  nodes: [
    { id: string, label: string, type: 'product' | 'brand' | 'category', color: string, size: number }
  ],
  links: [
    { source: string, target: string, label: string }
  ]
}
```

### Node colors
- Product: by ecoscore — A=#22c55e, B=#86efac, C=#facc15, D=#f97316, E=#ef4444, default=#6b7280
- Brand: #3b82f6 (blue), size 8
- Category: #a855f7 (purple), size 6
- Product: size 4

### Links
- Product → Brand (predicate: "brand")
- Product → Category, first category only (predicate: "category")

## UI Layout
```
+------------------+----------------------------+----------+
|  Filter Panel    |   3D Force Graph           |  Detail  |
|  (left, 220px)   |   (center, full height)    |  Panel   |
|                  |                            | (right,  |
|                  |                            | 300px,   |
|                  |                            | hidden   |
|                  |                            | by def.) |
+------------------+----------------------------+----------+
```

## FilterPanel behavior
Filters re-run the SPARQL query with added FILTER clauses.
- Ecoscore checkboxes: A B C D E
- Nutriscore checkboxes: A B C D E
- Brand text search: FILTER(CONTAINS(LCASE(?brand), "searchterm"))
- Limit slider: 10 to 200

## Detail Panel behavior
Slides in from the right when a product node is clicked.
Shows: product image, name, brand, GTIN, nutriscore badge, ecoscore badge, NOVA group, allergens, packaging materials, DPP status.
Hides when clicking elsewhere or pressing Escape.

## page.tsx pattern
```tsx
"use client";
import dynamic from "next/dynamic";

const ProductGraph = dynamic(() => import("@/components/ProductGraph"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="w-screen h-screen bg-black">
      <ProductGraph />
    </main>
  );
}
```

## Loading state
Show centered white text "Loading product graph..." with a spinner while the TTL is being fetched and parsed.

## Goal
A working demo showing 50-200 food products as a 3D force graph, connected to brands and categories, filterable, with a detail panel on click. All data from a flat TTL file. No API, no database, no backend.
