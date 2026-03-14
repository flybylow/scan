"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { runDetailQueryByGtin } from "@/lib/productQueries";
import type { ProductDetail } from "@/lib/productQueries";
import { ecoscoreColor } from "@/lib/productQueries";

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
  const v = value.toUpperCase();
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

export default function ProductDetailPage() {
  const params = useParams();
  const slug = (Array.isArray(params.slug) ? params.slug[0] : params.slug) ?? "";
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const gtin = decodeURIComponent(String(slug)).trim();
    runDetailQueryByGtin(gtin)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black px-3 py-2 md:px-4 md:py-3 flex items-center gap-2 md:gap-4">
        <Link
          href="/grid"
          className="min-h-[44px] flex items-center px-3 py-2 rounded text-xs font-semibold uppercase tracking-wide bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors touch-manipulation"
        >
          ← Grid
        </Link>
        <Link
          href="/"
          className="min-h-[44px] flex items-center px-3 py-2 rounded text-xs font-semibold uppercase tracking-wide bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors touch-manipulation"
        >
          Graph
        </Link>
        <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Product detail
        </h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-10 w-10 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading…</p>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-800 bg-red-900/40 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-4 text-xs">
            {detail.image && (
              <div className="w-full flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.image}
                  alt={detail.name}
                  className="max-h-48 rounded border border-zinc-800 object-contain bg-zinc-900"
                />
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Name
              </div>
              <div className="text-sm font-semibold text-zinc-100">
                {detail.name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Brand
                </div>
                <div className="text-xs text-zinc-200">{detail.brand}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  GTIN
                </div>
                <div className="text-xs text-zinc-200 tabular-nums">
                  {detail.gtin}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ScoreBadge label="Nutriscore" value={detail.nutriscore} type="nutri" />
              <ScoreBadge label="Ecoscore" value={detail.ecoscore} type="eco" />
              {detail.nova && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span>NOVA</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100">
                    {detail.nova}
                  </span>
                </span>
              )}
            </div>
            {detail.allergen && (
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Allergens
                </div>
                <div className="text-xs text-zinc-200">{detail.allergen}</div>
              </div>
            )}
            {detail.packaging && (
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Packaging
                </div>
                <div className="text-xs text-zinc-200 whitespace-pre-wrap">
                  {detail.packaging}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                DPP Status
              </div>
              <div className="text-xs text-zinc-200">{detail.status}</div>
            </div>
          </div>
        )}

        {!loading && !error && !detail && (
          <p className="text-sm text-zinc-400">Product not found.</p>
        )}
      </main>
    </div>
  );
}
