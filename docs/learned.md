# What we've learned

Running log of conventions, decisions, and gotchas. Append as we go. (Includes knowledge from prior conversations on this project.)

---

## Tabulas DPP Product Graph Explorer

### Comunica (SPARQL in the browser)

- **Source type for in-memory Turtle**: Use `type: "serialized"` (not `"stringSource"`) when passing fetched TTL text to Comunica’s `queryBindings`. With `"stringSource"` the query returns no results and no error.
- **Do not use** `@comunica/query-sparql-file` client-side — it uses Node.js `fs`. Fetch the TTL with `fetch('/products.ttl').then(r => r.text())` and pass it as a string source with `mediaType: 'text/turtle'` and `baseIRI`.

### React / Next.js

- **Duplicate keys in lists**: Brand/category product lists can contain the same product URI more than once. Use a composite key, e.g. `key={\`${p.uri}-${idx}\`}`, to avoid “Encountered two children with the same key”.
- **ProductGraph**: Load with `dynamic(..., { ssr: false })` because `react-force-graph-3d` is client-only.
- **Syntax gotcha**: “Expected '}', got '<eof>'” usually means the component function is missing a closing `}`. “Unterminated regexp literal” at end of file can be caused by `.replace(/\"/g, '\\\\\"')` or bad escaping inside template strings — the real bug is often earlier in the file.

### UI / layout

- **Detail (inspection) panel**: Must be positioned inside the graph area (e.g. `absolute` right overlay). If it’s rendered as a sibling below the graph, it can end up off-screen and clicks look like they do nothing.
- **Full-height sidebar**: For a right inspection panel to use full browser height, position it with `absolute inset-y-0 right-0` relative to the page root (not just the graph container) and let the panel content scroll; remove inner `max-h-*` caps so long lists use the full panel.

### react-force-graph-3d / Three.js

- **THREE.Clock deprecated**: The library still uses `THREE.Clock`; three.js logs “use THREE.Timer instead”. No fix on our side without forking; safe to ignore, only console noise.

### Product limit

- Limit slider was extended to **10–1000** (step 10), default **200**, so the full dataset can be shown.

### Inspection panel scope

- Detail panel was extended to **brand** and **category** nodes (not only products): brand click shows products for that brand; category click shows products in that category. For SPARQL filters on string literals (brand/category name), escape quotes in the literal to avoid broken queries.

---

## Turbopack / SWC parser (“Unterminated regexp literal”)

- **Cause**: With Next.js 16, the SWC parser can mis-parse when a **single file** has many hooks/state and a large nested JSX tree (lots of `</div>`). It can also be triggered by: **regex literals** (e.g. `/\"/g`), **`/` inside JSX** (e.g. Tailwind classes like `bg-zinc-950/95`), or **template literals** containing `/`.
- **Fix**: Split the UI so the main component file **only returns one component** (e.g. `return ( <ProductGraphLayout ... /> );`) and move the full layout JSX into a separate file (`ProductGraphLayout.tsx`). Move long SPARQL/query strings into a `lib/` module so the TSX file has no slash-heavy literals.
- **Stale errors**: If the error points to a line number that doesn’t exist in the current file (e.g. line 467 in a 97-line file), it’s a **stale cache**. Run `rm -rf .next` and restart `npm run dev`.
- **Tailwind opacity**: To avoid `/` in class names, replace `bg-zinc-950/95`, `bg-black/80` etc. with inline styles, e.g. `style={{ backgroundColor: "rgba(9, 9, 11, 0.95)" }}`. With webpack or after splitting components, Tailwind slash classes are usually fine.
- **Fallback**: Using `next dev --webpack` instead of Turbopack can make the same code parse correctly if splitting isn’t enough.

---

## SPARQL / Comunica – detail query and URIs

- **Angle brackets `<uri>`**: Putting the product URI directly in the query as `<uri>` can cause parse error “Expecting } but found '<'” if the URI or encoding confuses the parser. Avoid embedding user/decoded URIs in `<...>`.
- **Safe approach**: Use **`IRI("...")`** so the URI appears only inside a double-quoted string. Escape only `\` and `"` in that string (e.g. `replace(/\\\\/g, "\\\\\\\\").replace(/\"/g, '\\\\"')`). Then use `FILTER (?product = IRI("..."))` in the query. Never build `IRI("")`.
- **initialBindings**: With a **serialized** TTL source, Comunica may not apply `initialBindings` when matching triples, so the detail query can return no rows (“Product not found”). Prefer inlining the URI with proper escaping/validation over relying on bindings for the subject.
- **Empty tokens (“found: ''”)**: The parser throws when it sees an empty string literal. Never emit:
  - `IRI("")` — validate URI non-empty and `startsWith("http")` before building the query.
  - `FILTER(?brand = "")` or `FILTER(?category = "")` — if brand/category label is empty after trim, return early and don’t run the query.
  - `CONTAINS(LCASE(?brand), "")` — only add the CONTAINS filter when the search term is non-empty after stripping quotes; escape `\` and `"` in the term.
  - `LIMIT undefined` — use a safe limit, e.g. `Math.floor(Number(filters.limit))` with fallback to `100`.
- **Ecoscore/nutriscore filters**: When building `IN ("A", "B", ...)`, only include keys that are non-empty and single character so you never push `""` into the list.

---

## Grid and product detail pages

- **Slug**: Product detail route uses a base64url-encoded product URI. Helpers in `lib/slug.ts`: `productUriToSlug(uri)`, `slugToProductUri(slug)`. Must work in both browser and Node (SSR).
- **Params**: Next.js can pass `params.slug` as an array. Normalize: `(Array.isArray(params.slug) ? params.slug[0] : params.slug) ?? ""` before decoding.
- **Validation**: After decoding, check `uri.trim().startsWith("http")` before calling `runDetailQuery`; otherwise show error and don’t query.
- **Product nodes for grid**: Main query / graph node type should include optional `ecoscore` and `nutriscore` so the grid can show badges on cards.

---

## react-force-graph-3d – camera and focus

- **zoomToFit()** with a single node backs the camera off (zooms out). To “zoom in” on a node: use **`getGraphBbox(nodeFilter)`** to get the node’s bounds and center, then **`cameraPosition(position, lookAt, transitionMs)`** with a position a fixed distance (e.g. 50–120 units) from the node and `lookAt` = node center. Animate with e.g. 400 ms.
- **getGraphBbox**: Can return an object with undefined `x`/`y`/`z` when no nodes match or graph isn’t ready. Guard: `if (!bbox?.x?.length || !bbox?.y?.length || !bbox?.z?.length) return false;` to avoid “Cannot read properties of undefined (reading 'x')”.
- **Ref type**: The library’s ref type can be strict. Use a type assertion (e.g. `as any`) if needed to call `zoomToFit` or `cameraPosition` without TypeScript errors.
- **Retry**: If the node isn’t positioned yet (simulation still running), retry focus on next frame or after a short delay (e.g. 100 ms).

---

## Sidebar list → graph focus

- Inspection panel product lists (brand/category) can be **buttons** that (1) call the graph ref’s focus/zoom so the camera moves to that product node, and (2) call `onInspectionProductClick(productUri)` to load and show that product’s detail in the panel.
- **Selected node styling**: Pass `focusedNodeId` (product URI when a product is selected). Use a `useEffect` to call `focusGraphOnNode(focusedNodeId)` when selection changes. Give the focused node a distinct color (e.g. cyan), larger size, and optional pulse (setInterval toggling a scale between 0.85 and 1.25).

---

## QR/Barcode Scanner

- **ZXing**: Use `@zxing/browser` + `@zxing/library`. Load the Scanner component with `dynamic(..., { ssr: false })`; ZXing and camera APIs are client-only.
- **Camera**: Requires a **secure context** (HTTPS or localhost). On Vercel the app is served over HTTPS so the scanner works on mobile. For local mobile testing use `npm run dev:https` or a tunnel (ngrok, cloudflared). See `docs/mobile-testing.md`.
- **GTIN extraction**: From barcode/QR text, take digits only; accept 8–14 digits as valid GTIN (EAN-8 up to 14-digit). Strip non-digits with `text.replace(/\D/g, "")`.
- **Lookup**: Scanner calls `queryProduct(gtin)` which uses `runDetailQueryByGtin(digits)` from `lib/productQueries.ts` — same Comunica + fetch `/products.ttl` + `type: "serialized"` pattern as the graph app. No `query-sparql-file` in the browser.
- **Scan result flow**: On decode → stop camera → call `onResult(gtin)` → scan page sets state to loading → query product → show found (graph + ProductDetailCard) or not_found / error. Graph for scanned product uses `runTriplesForProduct(productUri)` to build nodes/links for that product’s triples.
- **Vercel**: Deploy via Git (connect repo in Vercel) or `vercel` / `vercel --prod` from the CLI. `public/products.ttl` is included in the build and served at `/products.ttl`. See `docs/deploy-vercel.md`.
