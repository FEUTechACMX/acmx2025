"use client";

import { useState } from "react";
import QrScanner from "../../../components/qr/QrScanner";

export default function ScanPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleScan = (encrypted: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    fetch("/api/scan/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encrypted }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Verification failed");
        const display =
          data?.user?.studentIdNumber ||
          data?.user?.schoolEmail ||
          data?.user?.id;
        setResult(`Verified: ${display ?? "OK"}`);
      })
      .catch((e) => {
        setError(e.message || "❌ Invalid QR or wrong key");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Scan QR Code</h1>
      <QrScanner onScan={handleScan} onError={(err) => console.warn(err)} />
      {loading && <p className="mt-4 text-gray-600">Verifying…</p>}
      {result && <p className="mt-4 text-green-600">{result}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
