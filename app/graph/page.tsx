"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const ProductGraph = dynamic(() => import("@/components/ProductGraph"), {
  ssr: false,
});

export default function GraphPage() {
  return (
    <main className="w-screen h-screen bg-black relative">
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="px-3 py-2 rounded-lg bg-zinc-800/90 text-zinc-200 text-sm font-medium hover:bg-zinc-700"
        >
          ← Home
        </Link>
      </div>
      <ProductGraph />
    </main>
  );
}
