"use client";

import React, { useState } from "react";
import QRScanner from "@/components/scanner/QRScanner";
import ScanDetailsForm from "@/components/scanner/ScanDetailsForm";
import ScanTypeSelector from "@/components/scanner/ScanTypeSelector";
import {
  verifyScannedQR,
  verifyUserFromQr,
  TimeIn,
  TimeOut,
} from "@/services/scanner/scannerService";
import { ScanType } from "@/types/scantTypes";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanType, setScanType] = useState<ScanType>("UserVerification");

  const currentEventId = "event_123";

  const attendanceScan = async (encrypted: string) => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      const payload = await verifyScannedQR(encrypted);

      if (scanType === "UserVerification") {
        const user = await verifyUserFromQr(payload);
        setResult(user);
      } else if (scanType === "TimeIn") {
        const user = await verifyUserFromQr;
        const attendanceResult = await TimeIn(payload, currentEventId);
        setResult({ user, attendance: attendanceResult });
      } else if (scanType === "TimeOut") {
        const user = await verifyUserFromQr(payload);
        const attendanceResult = await TimeOut(payload, currentEventId);
        setResult({ user, attendance: attendanceResult });
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Unknown error during scanning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex justify-around items-center">
      <QRScanner onScan={attendanceScan} />
      <div>
        <ScanTypeSelector value={scanType} onChange={setScanType} />
        <ScanDetailsForm />
      </div>
    </div>
  );
}
