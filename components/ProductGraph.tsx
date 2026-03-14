"use client";

import React, { useCallback, useEffect, useState } from "react";
import FilterPanel, { FiltersState } from "./FilterPanel";
import type { GraphNode, GraphData, DetailData } from "@/lib/productQueries";
import {
  runMainQuery,
  runDetailQuery,
  runBrandDetailQuery,
  runCategoryDetailQuery,
} from "@/lib/productQueries";
import ProductGraphLayout from "./ProductGraphLayout";

const defaultFilters: FiltersState = {
  ecoscore: { A: true, B: true, C: true, D: true, E: true },
  nutriscore: { A: true, B: true, C: true, D: true, E: true },
  brandSearch: "",
  limit: 200,
};

const MOBILE_LIMIT = 120;
const DESKTOP_LIMIT = 200;

export default function ProductGraph() {
  const [filters, setFilters] = useState(defaultFilters as FiltersState);

  useEffect(() => {
    const isNarrow = typeof window !== "undefined" && window.innerWidth < 768;
    setFilters((f) => ({ ...f, limit: isNarrow ? Math.min(f.limit, MOBILE_LIMIT) : f.limit }));
  }, []);
  const [graphData, setGraphData] = useState(null as GraphData | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [selected, setSelected] = useState(null as DetailData | null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    runMainQuery(filters)
      .then((data) => {
        if (!cancelled) setGraphData(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setDetailLoading(true);
    try {
      let detail: DetailData | null = null;
      if (node.type === "product") {
        detail = await runDetailQuery(node.id);
      } else if (node.type === "brand") {
        detail = await runBrandDetailQuery(node.label);
      } else if (node.type === "category") {
        detail = await runCategoryDetailQuery(node.label);
      }
      if (detail) setSelected(detail);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleInspectionProductClick = useCallback(async (productUri: string) => {
    setDetailLoading(true);
    try {
      const detail = await runDetailQuery(productUri);
      if (detail) setSelected(detail);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const focusedNodeId = selected?.nodeType === "product" ? selected.uri : null;

  return (
    <ProductGraphLayout
      filters={filters}
      onFiltersChange={setFilters}
      graphData={graphData}
      loading={loading}
      error={error}
      selected={selected}
      detailLoading={detailLoading}
      focusedNodeId={focusedNodeId}
      onNodeClick={handleNodeClick}
      onCloseDetail={() => setSelected(null)}
      onInspectionProductClick={handleInspectionProductClick}
    />
  );
}
