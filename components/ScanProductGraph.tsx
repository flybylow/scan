"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { TripleGraphData, TripleNode, TripleLink } from "@/lib/productQueries";
import { runTriplesForProduct } from "@/lib/productQueries";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

export default function ScanProductGraph({ productUri }: { productUri: string }) {
  const [data, setData] = useState<TripleGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    runTriplesForProduct(productUri)
      .then((graph) => {
        if (!cancelled) setData(graph);
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
  }, [productUri]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black text-zinc-300">
        <div className="h-10 w-10 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading graph…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-red-300 text-sm">
        Failed to load graph: {error}
      </div>
    );
  }

  const graphData = data ?? { nodes: [], links: [] };

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeLabel={(n: unknown) => (n as TripleNode).label}
      nodeColor={(n: unknown) =>
        (n as TripleNode).type === "uri" ? "#3b82f6" : "#a855f7"
      }
      nodeRelSize={4}
      linkWidth={0.4}
      linkColor={() => "#4b5563"}
      linkLabel={(l: unknown) => (l as TripleLink).label}
      linkDirectionalArrowLength={2.5}
      linkDirectionalArrowRelPos={1}
      backgroundColor="#000000"
    />
  );
}
