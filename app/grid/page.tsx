"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { runMainQuery } from "@/lib/productQueries";
import type { GraphNode } from "@/lib/productQueries";
import { ecoscoreColor } from "@/lib/productQueries";
import type { FiltersState } from "@/components/FilterPanel";

const defaultFilters: FiltersState = {
  ecoscore: { A: true, B: true, C: true, D: true, E: true },
  nutriscore: { A: true, B: true, C: true, D: true, E: true },
  brandSearch: "",
  limit: 500,
};

export default function GridPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const limit = typeof window !== "undefined" && window.innerWidth < 768 ? 200 : defaultFilters.limit;
    runMainQuery({ ...defaultFilters, limit })
      .then((data) => {
        const products = data.nodes.filter((n) => n.type === "product");
        setNodes(products);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black px-3 py-2 md:px-4 md:py-3 flex items-center gap-3">
        <Link
          href="/"
          className="min-h-[44px] flex items-center px-3 py-2 rounded text-xs font-semibold uppercase tracking-wide bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors touch-manipulation"
        >
          Graph
        </Link>
        <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Products
        </h1>
      </header>

      <main className="p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-10 w-10 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading products…</p>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-800 bg-red-900/40 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {nodes.map((node) => (
              <Link
                key={node.id}
                href={"/grid/product/" + encodeURIComponent((node.id.split("/").pop() ?? "").trim())}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden hover:border-zinc-600 hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors min-h-[120px] md:min-h-0 touch-manipulation"
              >
                <div className="aspect-square bg-zinc-950 flex items-center justify-center p-2">
                  {node.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={node.image}
                      alt={node.label}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-zinc-600 text-xs text-center">
                      No image
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-zinc-100 line-clamp-2">
                    {node.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {node.ecoscore && (
                      <span
                        className="inline-block w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center text-black"
                        style={{ backgroundColor: ecoscoreColor(node.ecoscore) }}
                        title={"Ecoscore " + node.ecoscore}
                      >
                        {node.ecoscore.charAt(0)}
                      </span>
                    )}
                    {node.nutriscore && (
                      <span
                        className="inline-block w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center text-black"
                        style={{
                          backgroundColor:
                            node.nutriscore === "A"
                              ? "#22c55e"
                              : node.nutriscore === "B"
                              ? "#86efac"
                              : node.nutriscore === "C"
                              ? "#facc15"
                              : node.nutriscore === "D"
                              ? "#f97316"
                              : node.nutriscore === "E"
                              ? "#ef4444"
                              : "#6b7280",
                        }}
                        title={"Nutriscore " + node.nutriscore}
                      >
                        {node.nutriscore.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
