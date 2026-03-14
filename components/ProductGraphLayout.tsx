"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import FilterPanel, { FiltersState, ScoreLetter } from "./FilterPanel";
import type { GraphNode, GraphData, DetailData } from "@/lib/productQueries";
import { ecoscoreColor } from "@/lib/productQueries";

const ForceGraph3D = dynamic(
  () => import("react-force-graph-3d"),
  { ssr: false }
);

function ScoreBadge({
  label,
  value,
  type,
}: {
  label: string;
  value?: string;
  type: "eco" | "nutri";
}) {
  if (!value) return null;
  const v = value.toUpperCase() as ScoreLetter | string;
  const bg =
    type === "eco"
      ? ecoscoreColor(v)
      : v === "A"
      ? "#22c55e"
      : v === "B"
      ? "#86efac"
      : v === "C"
      ? "#facc15"
      : v === "D"
      ? "#f97316"
      : v === "E"
      ? "#ef4444"
      : "#6b7280";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
      <span className="text-zinc-400">{label}</span>
      <span
        className="px-1.5 py-0.5 rounded text-black"
        style={{ backgroundColor: bg }}
      >
        {v}
      </span>
    </span>
  );
}

export interface ProductGraphLayoutProps {
  filters: FiltersState;
  onFiltersChange: (f: FiltersState) => void;
  graphData: GraphData | null;
  loading: boolean;
  error: string | null;
  selected: DetailData | null;
  detailLoading: boolean;
  focusedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
  onCloseDetail: () => void;
  onInspectionProductClick?: (productUri: string) => void;
}

const FOCUSED_NODE_BASE_SIZE = 14;
const FOCUSED_NODE_GLOW = "#a5f3fc";

export default function ProductGraphLayout({
  filters,
  onFiltersChange,
  graphData,
  loading,
  error,
  selected,
  detailLoading,
  focusedNodeId,
  onNodeClick,
  onCloseDetail,
  onInspectionProductClick,
}: ProductGraphLayoutProps) {
  type FgRef = {
    getGraphBbox?: (nodeFilter?: (n: unknown) => boolean) => { x: [number, number]; y: [number, number]; z: [number, number] };
    cameraPosition?: (position: { x?: number; y?: number; z?: number }, lookAt?: { x: number; y: number; z: number }, transitionMs?: number) => void;
    zoomToFit?: (durationMs?: number, padding?: number, nodeFilter?: (n: unknown) => boolean) => void;
  };
  const fgRef = useRef<FgRef | undefined>(undefined);
  const fgData = graphData ?? { nodes: [], links: [] };
  const detailOpen = !!selected;
  const [pulse, setPulse] = useState(1);
  const prevDetailOpen = useRef(false);

  useEffect(() => {
    if (!focusedNodeId) return;
    const id = setInterval(() => {
      setPulse((p) => (p >= 1.25 ? 0.85 : p + 0.04));
    }, 80);
    return () => clearInterval(id);
  }, [focusedNodeId]);

  useEffect(() => {
    if (focusedNodeId) focusGraphOnNode(focusedNodeId);
  }, [focusedNodeId]);

  useEffect(() => {
    const wasOpen = prevDetailOpen.current;
    prevDetailOpen.current = detailOpen;
    if (wasOpen && !detailOpen) {
      const fg = fgRef.current;
      if (fg?.zoomToFit) {
        const t = setTimeout(() => fg.zoomToFit?.(400, 20), 50);
        return () => clearTimeout(t);
      }
    }
  }, [detailOpen]);

  function focusGraphOnNode(nodeId: string) {
    const run = () => {
      try {
        const fg = fgRef.current as FgRef | null | undefined;
        if (!fg?.getGraphBbox || !fg?.cameraPosition) return false;
        const nodeFilter = (n: unknown) => (n as { id?: string }).id === nodeId;
        const bbox = fg.getGraphBbox(nodeFilter);
        if (!bbox || typeof bbox !== "object") return false;
        const xArr = bbox.x;
        const yArr = bbox.y;
        const zArr = bbox.z;
        if (!Array.isArray(xArr) || !Array.isArray(yArr) || !Array.isArray(zArr)) return false;
        if (xArr.length < 2 || yArr.length < 2 || zArr.length < 2) return false;
        const cx = (Number(xArr[0]) + Number(xArr[1])) / 2;
        const cy = (Number(yArr[0]) + Number(yArr[1])) / 2;
        const cz = (Number(zArr[0]) + Number(zArr[1])) / 2;
        if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cz)) return false;
        const dist = 50;
        const t = dist / Math.sqrt(3);
        fg.cameraPosition(
          { x: cx + t, y: cy + t, z: cz + t },
          { x: cx, y: cy, z: cz },
          400
        );
        return true;
      } catch {
        return false;
      }
    };
    if (run()) return;
    requestAnimationFrame(() => {
      if (run()) return;
      setTimeout(run, 100);
    });
  }

  function handleInspectionProductClick(productUri: string) {
    focusGraphOnNode(productUri);
    onInspectionProductClick?.(productUri);
  }

  return (
    <div className="w-full h-full flex flex-col bg-black text-zinc-100 overflow-hidden relative">
      <FilterPanel filters={filters} onChange={onFiltersChange} />
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="h-10 w-10 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-zinc-200">Loading product graph...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="px-4 py-3 rounded text-red-100 text-xs max-w-sm text-center border border-red-700"
              style={{ backgroundColor: "rgba(127, 29, 29, 0.6)" }}
            >
              Failed to load graph: {error}
            </div>
          </div>
        )}
        <div
          className="absolute left-2 top-2 md:left-4 md:top-4 z-10 rounded border border-zinc-800 px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs text-zinc-200 space-y-0.5 md:space-y-1 max-w-[140px] md:max-w-none"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <div className="text-[10px] md:text-xs uppercase tracking-wide text-zinc-400 mb-0.5 md:mb-1">
            Legend
          </div>
          <div className="space-y-1">
            {[
              ["#22c55e", "Product – ecoscore A"],
              ["#86efac", "Product – ecoscore B"],
              ["#facc15", "Product – ecoscore C"],
              ["#f97316", "Product – ecoscore D"],
              ["#ef4444", "Product – ecoscore E"],
              ["#3b82f6", "Brand node"],
              ["#a855f7", "Category node"],
            ].map(([color, label]) => (
              <div key={String(color)} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: String(color) }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ForceGraph3D
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={fgRef as any}
          graphData={fgData}
          nodeLabel={(n: unknown) => (n as GraphNode).label}
          nodeAutoColorBy={undefined}
          nodeColor={(n: unknown) => {
            const node = n as GraphNode;
            if (focusedNodeId && node.id === focusedNodeId) return FOCUSED_NODE_GLOW;
            return node.color;
          }}
          nodeRelSize={4}
          nodeVal={(n: unknown) => {
            const node = n as GraphNode;
            if (focusedNodeId && node.id === focusedNodeId) return FOCUSED_NODE_BASE_SIZE * pulse;
            return node.size;
          }}
          linkWidth={0.3}
          linkColor={() => "#4b5563"}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={0}
          backgroundColor="#000000"
          onNodeClick={(n: unknown) => onNodeClick(n as GraphNode)}
        />
      </div>
      {detailOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-10 bg-black/50 touch-manipulation"
          onClick={onCloseDetail}
          aria-label="Close panel"
        />
      )}
      <div
        className={
          "absolute z-20 text-zinc-100 transform transition-transform duration-300 ease-out " +
          "md:inset-y-0 md:right-0 md:w-80 md:border-l md:border-zinc-800 " +
          "inset-x-0 bottom-0 top-auto max-h-[85vh] rounded-t-xl border-t border-zinc-800 md:max-h-none md:rounded-none md:border-t-0 " +
          (detailOpen ? "translate-y-0 translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full")
        }
        style={{ backgroundColor: "rgba(9, 9, 11, 0.98)" }}
      >
        {detailOpen && selected && (
          <div className="h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {selected.nodeType === "product"
                  ? "Product detail"
                  : selected.nodeType === "brand"
                  ? "Brand detail"
                  : "Category detail"}
              </div>
              <button
                type="button"
                onClick={onCloseDetail}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 text-zinc-400 hover:text-zinc-100 touch-manipulation"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs">
              {detailLoading && (
                <div className="flex items-center justify-center py-8 gap-3">
                  <div className="h-6 w-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-zinc-300">Loading details…</span>
                </div>
              )}
              {!detailLoading && selected.nodeType === "product" && (
                <>
                  {selected.image && (
                    <div className="w-full flex justify-center">
                      <img
                        src={selected.image}
                        alt={selected.name}
                        className="max-h-40 rounded border border-zinc-800 object-contain bg-zinc-900"
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Name</div>
                    <div className="text-sm font-semibold text-zinc-100">{selected.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">Brand</div>
                      <div className="text-xs text-zinc-200">{selected.brand}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">GTIN</div>
                      <div className="text-xs text-zinc-200 tabular-nums">{selected.gtin}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ScoreBadge label="Nutriscore" value={selected.nutriscore} type="nutri" />
                    <ScoreBadge label="Ecoscore" value={selected.ecoscore} type="eco" />
                    {selected.nova && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        <span>NOVA</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100">
                          {selected.nova}
                        </span>
                      </span>
                    )}
                  </div>
                  {selected.allergen && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">Allergens</div>
                      <div className="text-xs text-zinc-200">{selected.allergen}</div>
                    </div>
                  )}
                  {selected.packaging && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-zinc-500">Packaging</div>
                      <div className="text-xs text-zinc-200 whitespace-pre-wrap">{selected.packaging}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">DPP Status</div>
                    <div className="text-xs text-zinc-200">{selected.status}</div>
                  </div>
                </>
              )}
              {!detailLoading && selected.nodeType === "brand" && (
                <>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Brand</div>
                    <div className="text-sm font-semibold text-zinc-100">{selected.brand}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Products in graph</div>
                    <div className="text-xs text-zinc-300 mb-2">
                      {selected.products.length} product{selected.products.length === 1 ? "" : "s"}
                    </div>
                    <div className="space-y-2 pr-1">
                      {selected.products.map((p, idx) => (
                        <button
                          type="button"
                          key={p.uri + "-" + idx}
                          onClick={() => handleInspectionProductClick(p.uri)}
                          className="w-full text-left border border-zinc-800 rounded px-2 py-1.5 cursor-pointer hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
                          style={{ backgroundColor: "rgba(9, 9, 11, 0.6)" }}
                        >
                          <div className="text-xs font-medium text-zinc-100">{p.name}</div>
                          <div className="flex items-center justify-between mt-1">
                            <ScoreBadge label="N" value={p.nutriscore} type="nutri" />
                            <ScoreBadge label="E" value={p.ecoscore} type="eco" />
                          </div>
                          {p.category && (
                            <div className="mt-1 text-xs text-zinc-400">{p.category}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {!detailLoading && selected.nodeType === "category" && (
                <>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Category</div>
                    <div className="text-sm font-semibold text-zinc-100">{selected.category}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">Products in graph</div>
                    <div className="text-xs text-zinc-300 mb-2">
                      {selected.products.length} product{selected.products.length === 1 ? "" : "s"}
                    </div>
                    <div className="space-y-2 pr-1">
                      {selected.products.map((p, idx) => (
                        <button
                          type="button"
                          key={p.uri + "-" + idx}
                          onClick={() => handleInspectionProductClick(p.uri)}
                          className="w-full text-left border border-zinc-800 rounded px-2 py-1.5 cursor-pointer hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
                          style={{ backgroundColor: "rgba(9, 9, 11, 0.6)" }}
                        >
                          <div className="text-xs font-medium text-zinc-100">{p.name}</div>
                          <div className="text-xs text-zinc-400">{p.brand}</div>
                          <div className="flex items-center justify-between mt-1">
                            <ScoreBadge label="N" value={p.nutriscore} type="nutri" />
                            <ScoreBadge label="E" value={p.ecoscore} type="eco" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
