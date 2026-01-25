"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type QRScannerProps = {
  active?: boolean;
  facingMode?: "environment" | "user";
  onScan: (data: string) => void | Promise<void>;
};

export default function QRScanner({
  active = true,
  facingMode = "environment",
  onScan,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || scanned || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err, controls) => {
          if (controls && !controlsRef.current) controlsRef.current = controls;

          if (result) {
            setScanned(true);
            controls?.stop();
            onScan(result.getText()); // just emit scanned string
          }

          if (err && err.name !== "NotFoundException") {
            setError(err.message);
          }
        },
      )
      .catch(() => setError("Camera access denied or unavailable"));

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, scanned, facingMode, onScan]);

  return (
    <div className="flex flex-col items-center gap-2">
      {error && <p className="text-red-500">{error}</p>}
      <div className="relative aspect-square lg:w-[25vw] overflow-hidden border-2">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />

        {/* Scanner mask */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-12 bg-black/60" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/60" />
          <div className="absolute top-12 bottom-12 left-0 w-12 bg-black/60" />
          <div className="absolute top-12 bottom-12 right-0 w-12 bg-black/60" />
          <div className="absolute inset-12 border-2 border-emerald-400 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
