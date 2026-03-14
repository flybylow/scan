import { QueryEngine } from "@comunica/query-sparql";
import { DataFactory } from "rdf-data-factory";
import { BindingsFactory } from "@comunica/utils-bindings-factory";
import type { FiltersState } from "@/components/FilterPanel";

const DF = new DataFactory();
const BF = new BindingsFactory(DF);

const SCHEMA = "https:" + "//schema.org/";
const DPP = "https:" + "//tabulas.eu/vocab/dpp#";
const GS1 = "https:" + "//www.gs1.org/voc/";
const BASE = "https:" + "//tabulas.eu/";

export type NodeType = "product" | "brand" | "category";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  color: string;
  size: number;
  image?: string;
  ecoscore?: string;
  nutriscore?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SummaryProduct {
  uri: string;
  name: string;
  brand: string;
  ecoscore: string;
  nutriscore: string;
  category?: string;
}

export interface ProductDetail {
  nodeType: "product";
  uri: string;
  name: string;
  brand: string;
  gtin: string;
  image?: string;
  ecoscore: string;
  nutriscore: string;
  nova?: string;
  allergen?: string;
  packaging?: string;
  status: string;
}

export interface BrandDetail {
  nodeType: "brand";
  brand: string;
  products: SummaryProduct[];
}

export interface CategoryDetail {
  nodeType: "category";
  category: string;
  products: SummaryProduct[];
}

export type DetailData = ProductDetail | BrandDetail | CategoryDetail;

export function ecoscoreColor(grade: string): string {
  switch (grade) {
    case "A":
      return "#22c55e";
    case "B":
      return "#86efac";
    case "C":
      return "#facc15";
    case "D":
      return "#f97316";
    case "E":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

const engine = new QueryEngine();

const TTL_URL = "/products.ttl";
const TURTLE = "text" + "/turtle";

async function getTurtle(): Promise<string> {
  const r = await fetch(TTL_URL);
  return r.text();
}

const MAIN_QUERY =
  "SELECT ?product ?name ?brand ?ecoscore ?nutriscore ?category ?image WHERE {\n" +
  "  ?product a <" + "https://schema.org/Product> ;\n" +
  "           <" + "https://schema.org/name> ?name ;\n" +
  "           <" + "https://schema.org/brand> ?brand ;\n" +
  "           <" + "https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;\n" +
  "           <" + "https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore .\n" +
  "  OPTIONAL { ?product <" + "https://schema.org/category> ?category . }\n" +
  "  OPTIONAL { ?product <" + "https://schema.org/image> ?image . }\n" +
  "}\n" +
  "LIMIT 500";

export async function runMainQuery(filters: FiltersState): Promise<GraphData> {
  const turtleText = await getTurtle();
  const limit = Math.min(500, Math.max(10, Number(filters?.limit) || 100));

  const bindingsStream = await engine.queryBindings(MAIN_QUERY, {
    sources: [
      {
        type: "serialized",
        value: turtleText,
        mediaType: TURTLE,
        baseIRI: BASE,
      },
    ],
  });

  const rawResults = await bindingsStream.toArray();

  const ecoAllowed = (filters.ecoscore && typeof filters.ecoscore === "object")
    ? new Set(Object.entries(filters.ecoscore).filter(([, v]) => v).map(([k]) => k))
    : null;
  const nutriAllowed = (filters.nutriscore && typeof filters.nutriscore === "object")
    ? new Set(Object.entries(filters.nutriscore).filter(([, v]) => v).map(([k]) => k))
    : null;
  const brandSearch = (filters.brandSearch && String(filters.brandSearch).trim()) || "";
  const brandLower = brandSearch ? brandSearch.toLowerCase() : "";

  const results = rawResults.filter((b) => {
    if (ecoAllowed && !ecoAllowed.has(b.get("ecoscore")?.value ?? "")) return false;
    if (nutriAllowed && !nutriAllowed.has(b.get("nutriscore")?.value ?? "")) return false;
    if (brandLower && !((b.get("brand")?.value ?? "").toLowerCase().includes(brandLower))) return false;
    return true;
  }).slice(0, limit);

  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  const ensureNode = (
    id: string,
    label: string,
    type: NodeType,
    extra?: Partial<GraphNode>
  ): GraphNode => {
    if (nodesMap.has(id)) return nodesMap.get(id)!;
    const base: GraphNode = {
      id,
      label,
      type,
      color:
        type === "brand"
          ? "#3b82f6"
          : type === "category"
          ? "#a855f7"
          : "#6b7280",
      size: type === "brand" ? 8 : type === "category" ? 6 : 4,
      ...extra,
    };
    nodesMap.set(id, base);
    return base;
  };

  for (const b of results) {
    const product = b.get("product")!.value;
    const name = b.get("name")!.value;
    const brand = b.get("brand")!.value;
    const ecoscore = b.get("ecoscore")!.value;
    const nutriscore = b.get("nutriscore")!.value;
    const category = b.get("category")?.value;
    const image = b.get("image")?.value;

    ensureNode(product, name, "product", {
      color: ecoscoreColor(ecoscore),
      size: 4,
      image,
      ecoscore,
      nutriscore,
    });

    const brandId = "brand:" + brand;
    ensureNode(brandId, brand, "brand");
    links.push({ source: product, target: brandId, label: "brand" });

    if (category) {
      const catId = "category:" + category;
      ensureNode(catId, category, "category");
      links.push({ source: product, target: catId, label: "category" });
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
  };
}

/** Detail query template: restrict by GTIN. We only inject a digits-only string so no parse risk. */
function buildDetailQuery(gtinDigits: string): string {
  return (
    "SELECT ?product ?name ?brand ?gtin ?image ?ecoscore ?nutriscore ?nova ?allergen ?packaging ?status WHERE {\n" +
    "  ?product <https://schema.org/name> ?name ;\n" +
    "           <https://schema.org/brand> ?brand ;\n" +
    "           <https://www.gs1.org/voc/gtin> ?gtin ;\n" +
    "           <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;\n" +
    "           <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore ;\n" +
    "           <https://tabulas.eu/vocab/dpp#status> ?status .\n" +
    "  OPTIONAL { ?product <https://schema.org/image> ?image . }\n" +
    "  OPTIONAL { ?product <https://tabulas.eu/vocab/dpp#novaGroup> ?nova . }\n" +
    "  OPTIONAL { ?product <https://tabulas.eu/vocab/dpp#containsAllergen> ?allergen . }\n" +
    "  OPTIONAL { ?product <https://tabulas.eu/vocab/dpp#packagingMaterial> ?packaging . }\n" +
    "  FILTER(?gtin = \"" + gtinDigits + "\")\n" +
    "}"
  );
}

/** Run detail query by product URI (graph/panel). Uses GTIN extracted from URI. */
export async function runDetailQuery(uri: string): Promise<ProductDetail | null> {
  const trimmed = typeof uri === "string" ? uri.trim() : "";
  if (!trimmed) return null;
  const gtin = trimmed.startsWith("http")
    ? (trimmed.split("/").pop() ?? "").trim()
    : trimmed;
  return runDetailQueryByGtin(gtin);
}

/** Run detail query by GTIN (detail page). Slug = GTIN; only digits → safe to put in FILTER. */
export async function runDetailQueryByGtin(gtin: string): Promise<ProductDetail | null> {
  const digits = typeof gtin === "string" ? gtin.trim() : "";
  if (!digits || !/^\d+$/.test(digits)) return null;
  const turtleText = await getTurtle();
  const query = buildDetailQuery(digits);

  const bindingsStream = await engine.queryBindings(query, {
    sources: [
      {
        type: "serialized",
        value: turtleText,
        mediaType: TURTLE,
        baseIRI: BASE,
      },
    ],
  });

  const results = await bindingsStream.toArray();
  const first = results[0];
  if (!first) return null;

  const get = (name: string) => first.get(name)?.value;
  const productUri = get("product") ?? "";

  return {
    nodeType: "product",
    uri: productUri,
    name: get("name") ?? "",
    brand: get("brand") ?? "",
    gtin: get("gtin") ?? "",
    image: get("image") ?? undefined,
    ecoscore: get("ecoscore") ?? "",
    nutriscore: get("nutriscore") ?? "",
    nova: get("nova") ?? undefined,
    allergen: get("allergen") ?? undefined,
    packaging: get("packaging") ?? undefined,
    status: get("status") ?? "",
  };
}

const BRAND_QUERY =
  "SELECT ?product ?name ?brand ?ecoscore ?nutriscore ?category WHERE {\n" +
  "  ?product a <https://schema.org/Product> ;\n" +
  "           <https://schema.org/name> ?name ;\n" +
  "           <https://schema.org/brand> ?brand ;\n" +
  "           <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;\n" +
  "           <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore .\n" +
  "  OPTIONAL { ?product <https://schema.org/category> ?category . }\n" +
  "  FILTER(?brand = ?brandValue)\n" +
  "}\n" +
  "LIMIT 100";

export async function runBrandDetailQuery(
  brandLabel: string
): Promise<BrandDetail> {
  const brand = typeof brandLabel === "string" ? brandLabel.trim() : "";
  if (!brand) {
    return { nodeType: "brand", brand: String(brandLabel || ""), products: [] };
  }
  const turtleText = await getTurtle();
  const initialBindings = BF.bindings([
    [DF.variable("brandValue"), DF.literal(brand)],
  ]);

  const bindingsStream = await engine.queryBindings(BRAND_QUERY, {
    sources: [
      {
        type: "serialized",
        value: turtleText,
        mediaType: TURTLE,
        baseIRI: BASE,
      },
    ],
    initialBindings,
  });

  const results = await bindingsStream.toArray();
  const products: SummaryProduct[] = results.map((b) => ({
    uri: b.get("product")!.value,
    name: b.get("name")!.value,
    brand: b.get("brand")!.value,
    ecoscore: b.get("ecoscore")!.value,
    nutriscore: b.get("nutriscore")!.value,
    category: b.get("category")?.value,
  }));

  return {
    nodeType: "brand",
    brand,
    products,
  };
}

const CATEGORY_QUERY =
  "SELECT ?product ?name ?brand ?ecoscore ?nutriscore ?category WHERE {\n" +
  "  ?product a <https://schema.org/Product> ;\n" +
  "           <https://schema.org/name> ?name ;\n" +
  "           <https://schema.org/brand> ?brand ;\n" +
  "           <https://tabulas.eu/vocab/dpp#ecoscoreGrade> ?ecoscore ;\n" +
  "           <https://tabulas.eu/vocab/dpp#nutriscoreGrade> ?nutriscore ;\n" +
  "           <https://schema.org/category> ?category .\n" +
  "  FILTER(?category = ?categoryValue)\n" +
  "}\n" +
  "LIMIT 100";

export async function runCategoryDetailQuery(
  categoryLabel: string
): Promise<CategoryDetail> {
  const category = typeof categoryLabel === "string" ? categoryLabel.trim() : "";
  if (!category) {
    return { nodeType: "category", category: String(categoryLabel || ""), products: [] };
  }
  const turtleText = await getTurtle();
  const initialBindings = BF.bindings([
    [DF.variable("categoryValue"), DF.literal(category)],
  ]);

  const bindingsStream = await engine.queryBindings(CATEGORY_QUERY, {
    sources: [
      {
        type: "serialized",
        value: turtleText,
        mediaType: TURTLE,
        baseIRI: BASE,
      },
    ],
    initialBindings,
  });

  const results = await bindingsStream.toArray();
  const products: SummaryProduct[] = results.map((b) => ({
    uri: b.get("product")!.value,
    name: b.get("name")!.value,
    brand: b.get("brand")!.value,
    ecoscore: b.get("ecoscore")!.value,
    nutriscore: b.get("nutriscore")!.value,
    category: b.get("category")?.value,
  }));

  return {
    nodeType: "category",
    category,
    products,
  };
}

export interface TripleNode {
  id: string;
  label: string;
  type: "uri" | "literal";
}

export interface TripleLink {
  source: string;
  target: string;
  label: string;
}

export interface TripleGraphData {
  nodes: TripleNode[];
  links: TripleLink[];
}

/** All triples for one product URI; for single-product graph visualization. */
export async function runTriplesForProduct(
  productUri: string
): Promise<TripleGraphData> {
  const uri = typeof productUri === "string" ? productUri.trim() : "";
  if (!uri || !uri.startsWith("http")) return { nodes: [], links: [] };

  const turtleText = await getTurtle();
  const query =
    "SELECT ?p ?o WHERE { ?product ?p ?o }";
  const initialBindings = BF.bindings([
    [DF.variable("product"), DF.namedNode(uri)],
  ]);

  const bindingsStream = await engine.queryBindings(query, {
    sources: [
      {
        type: "serialized",
        value: turtleText,
        mediaType: TURTLE,
        baseIRI: BASE,
      },
    ],
    initialBindings,
  });

  const results = await bindingsStream.toArray();
  const nodesMap = new Map<string, TripleNode>();
  const links: TripleLink[] = [];

  const shortUri = (u: string) => {
    try {
      const idx = u.indexOf("#");
      if (idx >= 0) return u.slice(idx + 1);
      const last = u.replace(/\/$/, "").split("/").pop();
      return last ?? u;
    } catch {
      return u;
    }
  };

  nodesMap.set(uri, {
    id: uri,
    label: shortUri(uri),
    type: "uri",
  });

  for (const b of results) {
    const p = b.get("p")?.value ?? "";
    const oTerm = b.get("o");
    if (!oTerm) continue;
    const oVal = oTerm.value;
    const oType = oTerm.termType === "Literal" ? "literal" : "uri";
    const predLabel = shortUri(p);

    const targetId = oType === "literal" ? `literal:${uri}:${p}:${oVal}` : oVal;
    if (!nodesMap.has(targetId)) {
      nodesMap.set(targetId, {
        id: targetId,
        label: oType === "literal" ? String(oVal).slice(0, 40) : shortUri(oVal),
        type: oType,
      });
    }
    links.push({ source: uri, target: targetId, label: predLabel });
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
  };
}
