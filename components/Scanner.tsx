"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { BrowserMultiFormatReader } from "@zxing/browser";

/** Extract numeric GTIN from barcode/QR result (EAN-13 or digits from QR). */
function extractGtin(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 8 && digits.length <= 14) return digits;
  return null;
}

export interface ScannerProps {
  onResult: (gtin: string) => void;
  onError?: (message: string) => void;
  onBack?: () => void;
}

export default function Scanner({
  onResult,
  onError,
  onBack,
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"requesting" | "ready" | "error">(
    "requesting"
  );
  const [errorMsg, setErrorMsg] = useState<string>("");
  const controlsRef = useRef<IScannerControls | null>(null);
  const stoppedRef = useRef(false);

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const nav = typeof navigator !== "undefined" ? navigator : null;
    const mediaDevices = nav?.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
      const msg =
        !nav
          ? "Not in a browser environment."
          : !mediaDevices
          ? "Camera not available. Use HTTPS or localhost."
          : "getUserMedia is not supported.";
      setErrorMsg(msg);
      setStatus("error");
      onError?.(msg);
      return;
    }

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, video, (result) => {
        if (stoppedRef.current) return;
        if (result) {
          const text = result.getText();
          const gtin = extractGtin(text);
          if (gtin) {
            stopCamera();
            onResult(gtin);
          }
        }
      })
      .then((controls) => {
        if (stoppedRef.current) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus("ready");
      })
      .catch((e) => {
        const msg =
          e?.name === "NotAllowedError"
            ? "Camera permission denied"
            : e?.message ?? "Camera not available";
        setErrorMsg(msg);
        setStatus("error");
        onError?.(msg);
      });

    return () => {
      stoppedRef.current = true;
      stopCamera();
    };
  }, [onResult, onError, stopCamera]);

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        {status === "ready" && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            aria-hidden
          >
            <div className="w-56 h-56 md:w-72 md:h-72 border-2 border-white/70 rounded-xl" />
          </div>
        )}
      </div>
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-black/90 text-zinc-100 text-center">
          <p className="text-sm">{errorMsg || "Camera access is needed to scan barcodes."}</p>
          <p className="text-xs text-zinc-400">
            Use HTTPS or localhost, and allow camera in browser settings.
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 touch-manipulation mt-2"
            >
              Back
            </button>
          )}
        </div>
      )}
      {onBack && (
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 safe-area-inset">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 touch-manipulation"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
