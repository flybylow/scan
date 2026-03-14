"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { queryProduct } from "@/lib/queryProduct";
import type { ProductDetail } from "@/lib/productQueries";
import ProductDetailCard from "@/components/ProductDetail";
import ScanProductGraph from "@/components/ScanProductGraph";

const Scanner = dynamic(() => import("@/components/Scanner"), {
  ssr: false,
});

type ScanState = "scanning" | "loading" | "found" | "not_found" | "error";

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>("scanning");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResult = useCallback(async (gtin: string) => {
    setState("loading");
    setErrorMessage(null);
    try {
      const result = await queryProduct(gtin);
      if (result) {
        setProduct(result);
        setState("found");
      } else {
        setProduct(null);
        setState("not_found");
      }
    } catch (e) {
      setProduct(null);
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }, []);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setState("error");
  }, []);

  const backToScanner = useCallback(() => {
    setState("scanning");
    setProduct(null);
    setErrorMessage(null);
  }, []);

  if (state === "scanning") {
    return (
      <Scanner
        onResult={handleResult}
        onError={handleError}
        onBack={() => router.push("/")}
      />
    );
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-300 p-6">
        <div className="h-12 w-12 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Looking up product in products.ttl…</p>
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6 text-zinc-100">
        <p className="text-center text-lg font-medium">
          Product not found in dataset.
        </p>
        <p className="text-sm text-zinc-400 text-center max-w-sm">
          This GTIN is not in products.ttl. Try another barcode or add the product to the dataset.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={backToScanner}
            className="px-5 py-2.5 rounded-lg bg-zinc-700 text-white font-medium hover:bg-zinc-600 touch-manipulation"
          >
            Scan again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 font-medium hover:bg-zinc-700 touch-manipulation text-center"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6 text-zinc-100">
        <p className="text-center text-lg font-medium text-red-300">
          {errorMessage ?? "Something went wrong."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={backToScanner}
            className="px-5 py-2.5 rounded-lg bg-zinc-700 text-white font-medium hover:bg-zinc-600 touch-manipulation"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 font-medium hover:bg-zinc-700 touch-manipulation text-center"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (state === "found" && product && product.nodeType === "product") {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 min-h-[50vh] lg:min-h-0 relative">
            <ScanProductGraph productUri={product.uri} />
          </div>
          <div className="p-4 lg:p-6 overflow-y-auto flex flex-col gap-4">
            <ProductDetailCard product={product} onBackToScanner={backToScanner} />
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              ← Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
