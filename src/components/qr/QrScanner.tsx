"use client";

import { useEffect, useRef, useId } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QrScannerProps {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerId = useId();
  const elementId = `qr-reader-${scannerId.replace(/:/g, "")}`;

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      elementId,
      { fps: 10, qrbox: 250 },
      false // 👈 verbose flag required
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      }
    );

    return () => {
      scanner
        .clear()
        .catch((err) => console.error("Failed to clear scanner", err));
    };
  }, [onScan, onError, elementId]);

  return <div id={elementId} ref={scannerRef} className="w-full" />;
}
