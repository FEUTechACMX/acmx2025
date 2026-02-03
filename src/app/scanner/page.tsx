"use client";

import React, { useState, useCallback } from "react";
import QRScanner from "@/components/scanner/QRScanner";
import ScanDetailsForm, {
  ScanResult,
} from "@/components/scanner/ScanDetailsForm";
import ScanTypeSelector from "@/components/scanner/ScanTypeSelector";
import { ScanType } from "@/types/scantTypes";

export default function ScannerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [payload, setPayload] = useState<ScanResult["payload"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scanType, setScanType] = useState<ScanType>("UserVerification");
  const [eventCode, setEventCode] = useState("");

  const requiresEventCode = scanType === "TimeIn" || scanType === "TimeOut";

  const processQrScan = useCallback(async (encrypted: string) => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/scan/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to process QR code");
      }

      setPayload(data.payload);
      setResult({
        payload: data.payload,
        user: data.user,
      });
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Unknown error during scanning");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!payload) {
      setError("No scan data to submit");
      return;
    }

    if (requiresEventCode && !eventCode.trim()) {
      setError("Please enter an event code");
      return;
    }

    if (scanType === "UserVerification") {
      setSuccessMessage("User verified successfully!");
      return;
    }

    if (scanType === "Payment") {
      // TODO: Implement payment processing
      setSuccessMessage("Payment verified!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/scan/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType,
          payload,
          eventId: eventCode.trim(),
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to record attendance");
      }

      setSuccessMessage(data.message);
      setResult(null);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  }, [payload, scanType, eventCode, requiresEventCode]);

  const handleCancel = useCallback(() => {
    setResult(null);
    setPayload(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setPayload(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-black/40 backdrop-blur-sm flex flex-col md:flex-row">
      {/* Left Section - Scanner (centered) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[450px] flex flex-col items-center">
          <h2 className="text-white font-['supermolot'] text-lg uppercase tracking-wider mb-6">
            QR Scanner
          </h2>
          <QRScanner
            onScan={processQrScan}
            onReset={handleReset}
            active={!result && !loading}
          />
        </div>
      </div>

      {/* Right Section - Details (justified/full width) */}
      <div className="flex-1 flex flex-col p-6 md:p-12 border-t md:border-t-0 md:border-l border-white/10">
        <div className="w-full max-w-[600px] flex flex-col gap-6 flex-1">
          {/* Scan Type Selector */}
          <ScanTypeSelector
            value={scanType}
            onChange={setScanType}
            disabled={loading || !!result}
          />

          {/* Event Code Input (for Time In/Out) */}
          {requiresEventCode && (
            <div className="flex flex-col gap-2">
              <label className="text-white/60 text-xs uppercase tracking-wider font-['supermolot']">
                Event Code
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="Enter event code..."
                disabled={loading}
                className="w-full px-4 py-3 bg-transparent border-2 border-[#CD78EC]/30 text-white placeholder:text-white/30 font-['supermolot'] text-sm uppercase tracking-wider focus:outline-none focus:border-[#CD78EC] transition-colors disabled:opacity-50"
              />
            </div>
          )}

          {/* Scan Details */}
          <div className="flex-1">
            <label className="text-white/60 text-xs uppercase tracking-wider font-['supermolot'] block mb-2">
              Scan Details
            </label>
            <ScanDetailsForm
              loading={loading}
              error={error}
              result={result}
              successMessage={successMessage}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading || (!result && !error && !successMessage)}
              className="flex-1 px-6 py-4 border-2 border-white/30 text-white/70 font-['supermolot'] text-sm uppercase tracking-wider hover:border-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !result || (requiresEventCode && !eventCode.trim())}
              className="flex-1 px-6 py-4 bg-[#CD78EC] text-white font-['supermolot'] text-sm uppercase tracking-wider hover:bg-[#b85cd6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {scanType === "UserVerification"
                ? "Confirm"
                : scanType === "Payment"
                  ? "Verify Payment"
                  : scanType === "TimeIn"
                    ? "Record Time In"
                    : "Record Time Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
