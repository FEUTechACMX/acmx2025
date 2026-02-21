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
    <article
      className="min-h-[100dvh] w-full bg-white text-black"
      style={{ fontFamily: "Arian-light, sans-serif" }}
    >
      {/* ── Page Header ── */}
      <header className="px-6 md:px-16 pt-28 pb-10">
        <p
          className="text-[#CF78EC] text-xs uppercase tracking-[0.3em] mb-3"
          style={{ fontFamily: "supermolot, sans-serif" }}
        >
          Admin Tool
        </p>
        <h1
          className="text-4xl md:text-5xl text-black leading-tight"
          style={{ fontFamily: "Arian-bold, sans-serif" }}
        >
          QR Scanner
        </h1>
        <div className="w-16 h-[2px] bg-[#CF78EC] mt-5" />
      </header>

      {/* ── Content Grid ── */}
      <div className="px-6 md:px-16 pb-20 flex flex-col lg:flex-row gap-12 lg:gap-16">

        {/* ── Left Column: Scanner ── */}
        <section className="lg:w-[45%] flex flex-col">
          <p
            className="text-black/40 text-xs uppercase tracking-[0.2em] mb-4"
            style={{ fontFamily: "supermolot, sans-serif" }}
          >
            Scan Area
          </p>
          <div className="border-t border-black/10 pt-6">
            <QRScanner
              onScan={processQrScan}
              onReset={handleReset}
              active={!result && !loading}
            />
          </div>
        </section>

        {/* ── Right Column: Controls & Details ── */}
        <section className="lg:w-[55%] flex flex-col gap-8">

          {/* Scan Mode */}
          <div>
            <p
              className="text-black/40 text-xs uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: "supermolot, sans-serif" }}
            >
              Configuration
            </p>
            <div className="border-t border-black/10 pt-6">
              <ScanTypeSelector
                value={scanType}
                onChange={setScanType}
                disabled={loading || !!result}
              />
            </div>
          </div>

          {/* Event Code */}
          {requiresEventCode && (
            <div>
              <label
                className="text-black/40 text-xs uppercase tracking-[0.2em] block mb-3"
                style={{ fontFamily: "supermolot, sans-serif" }}
              >
                Event Code
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="Enter event code..."
                disabled={loading}
                className="w-full px-4 py-3 bg-transparent border border-black/20 text-black placeholder:text-black/25 text-sm tracking-wide focus:outline-none focus:border-[#CF78EC] transition-colors disabled:opacity-40"
                style={{ fontFamily: "Arian-light, sans-serif" }}
              />
            </div>
          )}

          {/* Scan Details */}
          <div>
            <p
              className="text-black/40 text-xs uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: "supermolot, sans-serif" }}
            >
              Scan Details
            </p>
            <div className="border-t border-black/10 pt-6">
              <ScanDetailsForm
                loading={loading}
                error={error}
                result={result}
                successMessage={successMessage}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleCancel}
              disabled={loading || (!result && !error && !successMessage)}
              className="flex-1 px-6 py-3.5 border border-black/20 text-black/50 text-sm uppercase tracking-wider hover:border-black/40 hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              style={{ fontFamily: "supermolot, sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !result || (requiresEventCode && !eventCode.trim())}
              className="flex-1 px-6 py-3.5 bg-[#CF78EC] text-white text-sm uppercase tracking-wider hover:bg-[#b85cd6] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              style={{ fontFamily: "supermolot, sans-serif" }}
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
        </section>
      </div>
    </article>
  );
}
