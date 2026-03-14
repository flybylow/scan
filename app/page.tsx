"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-xl font-semibold text-zinc-100 text-center">
        prodlist_triple
      </h1>
      <p className="text-sm text-zinc-400 text-center max-w-sm">
        Scan a product barcode or browse the product graph.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Link
          href="/scan"
          className="flex-1 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-center hover:bg-blue-500 active:bg-blue-700 touch-manipulation transition-colors"
        >
          Scan
        </Link>
        <Link
          href="/graph"
          className="flex-1 px-6 py-4 rounded-xl border border-zinc-600 text-zinc-200 font-medium text-center hover:bg-zinc-800 touch-manipulation transition-colors"
        >
          Browse graph
        </Link>
      </div>
      <Link
        href="/grid"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        Grid view →
      </Link>
    </main>
  );
}
