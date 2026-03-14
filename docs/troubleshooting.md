# Troubleshooting

Quick reference for common errors and fixes. Details are in [learned.md](learned.md).

| Symptom | Likely cause | What to do |
|--------|---------------|------------|
| **Unterminated regexp literal** (at `</div>` or end of file) | SWC/Turbopack parser + large JSX in one file, or `/` in class names / regex in same file | Split layout into a separate component so the main file returns a single component; move SPARQL to `lib/`. Or `rm -rf .next` and restart. See [learned.md](learned.md)#turbopack--swc-parser. |
| **Expected '}', got '<eof>'** | Missing closing `}` on a function/block | Add the missing `}` at the end of the component. |
| **Parse error Expecting } but found '<'** (SPARQL) | Product URI embedded in query as `<uri>` | Use `IRI("...")` with escaped URI in a string instead of angle brackets. See [learned.md](learned.md)#sparql--comunica--detail-query-and-uris. |
| **Parse error … but found: ''** (SPARQL) | Empty string in query: `IRI("")`, `FILTER(...= "")`, `CONTAINS(..., "")`, or `LIMIT undefined` | Validate: non-empty URI, non-empty brand/category/search term, safe numeric LIMIT. See [learned.md](learned.md)#sparql--comunica--detail-query-and-uris. |
| **Product not found** (detail page) | Bad slug decode, or using `initialBindings` with serialized TTL (Comunica may not match) | Normalize slug from params; validate decoded URI; prefer inlined URI with escaping over initialBindings. |
| **Graph empty, no error** | Wrong Comunica source type | Use `type: "serialized"` (not `"stringSource"`) for in-memory Turtle. See [learned.md](learned.md)#comunica-sparql-in-the-browser. |
| **Cannot read properties of undefined (reading 'x')** | `getGraphBbox()` returned bbox without `x`/`y`/`z` | Guard: `if (!bbox?.x?.length || !bbox?.y?.length || !bbox?.z?.length) return;` before using bbox. |
| **Encountered two children with the same key** | Same product URI repeated in brand/category list | Use composite key: `key={\`${p.uri}-${idx}\`}`. |
| **Detail panel does nothing on click** | Panel rendered outside visible area (e.g. below graph) | Position panel inside graph area as `absolute` right overlay. |
| **THREE.Clock deprecated** (console) | react-force-graph-3d uses deprecated three.js API | Harmless; ignore or filter in console. |

For app structure and intended behavior, see [PRD-tabulas-dpp-product-graph-explorer.md](PRD-tabulas-dpp-product-graph-explorer.md).
