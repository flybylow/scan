import type { ProductDetail } from "@/lib/productQueries";
import { runDetailQueryByGtin } from "@/lib/productQueries";

/**
 * Look up a product by GTIN in products.ttl via Comunica.
 * Returns product detail or null if not found.
 * Engine instance is shared/cached in productQueries.
 */
export async function queryProduct(gtin: string): Promise<ProductDetail | null> {
  const digits = typeof gtin === "string" ? gtin.replace(/\D/g, "").trim() : "";
  if (!digits) return null;
  return runDetailQueryByGtin(digits);
}
