# Grid → Detail flow and SPARQL

## Flow

1. **Grid page (`/grid`)**
   - Runs **main SPARQL** once to list products.
   - Each result has `?product` = product IRI (e.g. `https://tabulas.eu/product/3274080005003`).
   - We build nodes with `node.id = product` (that full IRI).
   - Each card links to: `/grid/product/{slug}` where `slug = productUriToSlug(node.id)` (base64url of the IRI).

2. **User clicks a product**
   - Browser goes to e.g. `/grid/product/aHR0cHM6Ly90YWJ1bGFzLmV1L3Byb2R1Y3QvMzI3NDA4MDAwNTAwMw`.

3. **Detail page (`/grid/product/[slug]`)**
   - Reads `params.slug`, decodes with `slugToProductUri(slug)` → back to the product IRI.
   - Calls `runDetailQuery(uri)` with that IRI.
   - We run **detail SPARQL** to get name, brand, gtin, image, ecoscore, nutriscore, nova, allergen, packaging, status for that one product.

4. **What the detail query must do**
   - Restrict to **that one product** (that IRI).
   - Return one row so we can show name, brand, gtin, etc.

---

## SPARQL we use today

### Main query (grid)

```sparql
SELECT ?product ?name ?brand ?ecoscore ?nutriscore ?category ?image WHERE {
  ?product a <https://schema.org/Product> ;
           <https://schema.org/name> ?name ;
           <https://schema.org/brand> ?brand ;
           <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;
           <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore .
  OPTIONAL { ?product <https://schema.org/category> ?category . }
  OPTIONAL { ?product <https://schema.org/image> ?image . }
}
LIMIT 500
```

- No filter: we get up to 500 products, then filter by ecoscore/nutriscore/brand in JS.
- `?product` is the product IRI from the TTL (e.g. `https://tabulas.eu/product/3274080005003`).

### Detail query (current – broken)

**Query (static, no URI in the text):**

```sparql
SELECT ?name ?brand ?gtin ?image ?ecoscore ?nutriscore ?nova ?allergen ?packaging ?status WHERE {
  ?product <https://schema.org/name> ?name ;
           <https://schema.org/brand> ?brand ;
           <https://www.gs1.org/voc/gtin> ?gtin ;
           <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;
           <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore ;
           <https://tabulas.eu/vocab/dpp#status> ?status .
  OPTIONAL { ?product <https://schema.org/image> ?image . }
  OPTIONAL { ?product <https://tabulas.eu/vocab/dpp#novaGroup> ?nova . }
  OPTIONAL { ?product <https://tabulas.eu/vocab/dpp#containsAllergen> ?allergen . }
  OPTIONAL { ?product <https://tabulas.eu/vocab/dpp#packagingMaterial> ?packaging . }
}
```

**How we try to restrict to one product:** we pass `initialBindings` with `?product` bound to the product IRI (e.g. `DF.namedNode(uri)`).

**The thought mistake:** with a **serialized** TTL source, Comunica may not apply `initialBindings` so that the BGP is restricted to that one subject. So the engine might still match every product (or no solutions), and we get “Product not found”.

---

## What we need for detail

We must restrict the detail query to **one product** in a way the engine actually uses:

1. **Option A – URI in the query (subject in triple pattern)**  
   Use the product IRI directly in the query, e.g.  
   `<https://tabulas.eu/product/3274080005003>` in place of `?product`.  
   That requires concatenating the URI into the query string, which has caused parse errors when the URI or encoding was wrong.

2. **Option B – Restrict by GTIN (no URI in query)**  
   In your TTL, product IRIs are `https://tabulas.eu/product/{gtin}` and each product has `gs1:gtin "…"`.  
   - Encode only the **GTIN** in the slug (e.g. `3274080005003`), not the full IRI.  
   - Detail query uses e.g. `FILTER(?gtin = "3274080005003")` with that GTIN.  
   - GTIN is digits-only → safe to put in a string literal; no angle brackets, no empty token.  
   - We get one row and still have `?product` in the SELECT so we get the product IRI for the response.

---

## Implemented: Option B (GTIN in URL)

- **Grid link:** `/grid/product/{gtin}` where `gtin = node.id.split("/").pop()` (e.g. `3274080005003`). No base64.
- **Detail page:** `params.slug` is the GTIN. We call `runDetailQueryByGtin(slug)`.
- **Detail SPARQL:** We restrict with `FILTER(?gtin = "3274080005003")` — we only inject a **digits-only** string (validated with `/^\d+$/`), so no parse risk and the engine really filters to one product.

```sparql
SELECT ?product ?name ?brand ?gtin ?image ?ecoscore ?nutriscore ?nova ?allergen ?packaging ?status WHERE {
  ?product <https://schema.org/name> ?name ;
           <https://schema.org/brand> ?brand ;
           <https://www.gs1.org/voc/gtin> ?gtin ;
           ...
  FILTER(?gtin = "3274080005003")
}
```

- **Graph/panel:** When opening detail from the graph we still have the full product URI; we extract GTIN from it and call `runDetailQueryByGtin(gtin)` (via `runDetailQuery(uri)`).
