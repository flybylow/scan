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

/** GTINs that exist in products.ttl for testing. */
const TEST_GTINS = [
  { gtin: "3274080005003", label: "Cristaline water" },
  { gtin: "7622210449283", label: "Prince biscuit" },
  { gtin: "3017620425035", label: "Nutella" },
];

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>("scanning");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [scannedGtin, setScannedGtin] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResult = useCallback(async (gtin: string) => {
    setScannedGtin(gtin);
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
    setScannedGtin(null);
    setErrorMessage(null);
  }, []);

  const tryTestGtin = useCallback(
    (gtin: string) => {
      handleResult(gtin);
    },
    [handleResult]
  );

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
        {scannedGtin && (
          <p className="text-xs text-zinc-500 font-mono tabular-nums">
            Scanned GTIN: {scannedGtin}
          </p>
        )}
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6 text-zinc-100">
        <p className="text-center text-lg font-medium">
          Product not in dataset
        </p>
        {scannedGtin && (
          <p className="text-center font-mono text-sm text-zinc-400 tabular-nums">
            Scanned GTIN: {scannedGtin}
          </p>
        )}
        <p className="text-sm text-zinc-400 text-center max-w-sm">
          Our dataset has a limited set of products. Try another barcode or use a test product below to verify the scanner.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <span className="text-xs text-zinc-500 text-center">Try a barcode we have:</span>
          {TEST_GTINS.map(({ gtin, label }) => (
            <button
              key={gtin}
              type="button"
              onClick={() => tryTestGtin(gtin)}
              className="px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 text-left text-sm hover:bg-zinc-700 touch-manipulation border border-zinc-700"
            >
              <span className="font-mono tabular-nums">{gtin}</span>
              <span className="text-zinc-500 ml-2">— {label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
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
        {scannedGtin && (
          <div className="shrink-0 px-4 py-2 bg-zinc-900/80 text-center">
            <span className="text-xs text-zinc-500">Scanned GTIN </span>
            <span className="font-mono text-sm text-zinc-300 tabular-nums">{scannedGtin}</span>
          </div>
        )}
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
