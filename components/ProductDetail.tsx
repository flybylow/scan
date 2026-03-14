"use client";

import React from "react";
import type { ProductDetail as ProductDetailType } from "@/lib/productQueries";
import { ecoscoreColor } from "@/lib/productQueries";

function ScoreBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;
  const v = value.toUpperCase();
  const bg =
    v === "A"
      ? "#22c55e"
      : v === "B"
      ? "#86efac"
      : v === "C"
      ? "#facc15"
      : v === "D"
      ? "#f97316"
      : v === "E"
      ? "#ef4444"
      : ecoscoreColor(v);
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

export default function ProductDetailCard({
  product,
  onBackToScanner,
}: {
  product: ProductDetailType;
  onBackToScanner: () => void;
}) {
  if (product.nodeType !== "product") return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 text-zinc-100 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Product detail
        </span>
        <button
          type="button"
          onClick={onBackToScanner}
          className="px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-600 touch-manipulation"
        >
          Back to scanner
        </button>
      </div>
      <div className="p-4 space-y-4">
        {product.image && (
          <div className="flex justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-36 rounded border border-zinc-800 object-contain bg-zinc-950"
            />
          </div>
        )}
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Name</div>
          <div className="text-base font-semibold text-zinc-100">{product.name}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Brand</div>
            <div className="text-sm text-zinc-200">{product.brand}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">GTIN</div>
            <div className="text-sm text-zinc-200 tabular-nums">{product.gtin}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge label="Nutriscore" value={product.nutriscore} />
          <ScoreBadge label="Ecoscore" value={product.ecoscore} />
          {product.nova != null && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <span>NOVA</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100">
                {product.nova}
              </span>
            </span>
          )}
        </div>
        {product.allergen && (
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Allergens</div>
            <div className="text-sm text-zinc-200">{product.allergen}</div>
          </div>
        )}
        {product.packaging && (
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Packaging</div>
            <div className="text-sm text-zinc-200 whitespace-pre-wrap">{product.packaging}</div>
          </div>
        )}
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">DPP Status</div>
          <div className="text-sm text-zinc-200">{product.status}</div>
        </div>
      </div>
    </div>
  );
}
