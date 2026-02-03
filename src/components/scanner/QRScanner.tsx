"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type QRScannerProps = {
  active?: boolean;
  facingMode?: "environment" | "user";
  onScan: (data: string) => void | Promise<void>;
  onReset?: () => void;
};

export default function QRScanner({
  active = true,
  facingMode = "environment",
  onScan,
  onReset,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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
            onScan(result.getText());
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

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessingFile(true);
      setError(null);

      try {
        const reader = new BrowserMultiFormatReader();
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = async () => {
          try {
            const result = await reader.decodeFromImageElement(img);
            setScanned(true);
            controlsRef.current?.stop();
            onScan(result.getText());
          } catch {
            setError("Could not read QR code from image");
          } finally {
            URL.revokeObjectURL(url);
            setIsProcessingFile(false);
          }
        };

        img.onerror = () => {
          setError("Failed to load image");
          URL.revokeObjectURL(url);
          setIsProcessingFile(false);
        };

        img.src = url;
      } catch {
        setError("Failed to process file");
        setIsProcessingFile(false);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onScan],
  );

  const handleReset = useCallback(() => {
    setScanned(false);
    setError(null);
    onReset?.();
  }, [onReset]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && (
        <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Scanner viewport - semi-transparent dark */}
      <div className="relative aspect-square w-full max-w-[400px] overflow-hidden border-2 border-[#CD78EC]/50 bg-black/70 backdrop-blur-sm">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />

        {/* Scanner overlay */}
        <div className="pointer-events-none absolute inset-0">
          {/* Corner markers */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#CD78EC]" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#CD78EC]" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#CD78EC]" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#CD78EC]" />

          {/* Scan line animation */}
          {active && !scanned && (
            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#CD78EC] to-transparent animate-pulse top-1/2" />
          )}
        </div>

        {/* Scanned overlay */}
        {scanned && (
          <div className="absolute inset-0 bg-[#CD78EC]/20 flex items-center justify-center">
            <div className="bg-[#CD78EC] text-white px-4 py-2 font-['supermolot'] text-sm uppercase tracking-wider">
              QR Captured
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessingFile && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-[#CD78EC] font-['supermolot'] text-sm uppercase tracking-wider animate-pulse">
              Processing...
            </div>
          </div>
        )}
      </div>

      {/* File upload */}
      <div className="flex gap-3 w-full max-w-[400px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="qr-file-upload"
        />
        <label
          htmlFor="qr-file-upload"
          className="flex-1 cursor-pointer border-2 border-[#CD78EC]/50 px-4 py-3 text-center text-[#CD78EC] font-['supermolot'] text-sm uppercase tracking-wider hover:bg-[#CD78EC]/10 transition-colors"
        >
          Upload QR Image
        </label>

        {scanned && (
          <button
            onClick={handleReset}
            className="px-4 py-3 border-2 border-white/30 text-white/70 font-['supermolot'] text-sm uppercase tracking-wider hover:border-white/50 hover:text-white transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
