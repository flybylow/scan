export function productUriToSlug(uri: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(uri, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  }
  return btoa(uri).replace(/\+/g, "-").replace(/\//g, "_");
}

export function slugToProductUri(slug: string): string {
  const base64 = slug.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  return atob(base64);
}
