"use client";

import { useState } from "react";
import QrScanner from "@/components/qr/QrScanner";

export default function ScanPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleScan = (encrypted: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    fetch("/api/scan/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encrypted }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Verification failed");
        setResult(data.user); // 💡 store user object directly
      })
      .catch((e) => {
        setError(e.message || "❌ Invalid QR or wrong key");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6 min-h-screen flex flex-col items-center bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Scan QR Code</h1>

      {/* Scanner box */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4 border">
        <QrScanner onScan={handleScan} onError={(err) => console.warn(err)} />
      </div>

      {/* Loading */}
      {loading && (
        <p className="mt-6 text-gray-600 animate-pulse">Verifying…</p>
      )}

      {/* ✅ Success Card */}
      {result && !error && (
        <div className="mt-6 w-full max-w-sm bg-green-100 border border-green-400 rounded-2xl shadow p-5 text-center animate-fade-in">
          <h2 className="text-lg font-bold text-green-800 mb-2">
            ✅ Verified Successfully
          </h2>
          <p className="text-gray-800 text-sm mb-1">
            <span className="font-semibold">Student ID:</span>{" "}
            {result.studentId}
          </p>
          <p className="text-gray-800 text-sm mb-1">
            <span className="font-semibold">Name:</span> {result.firstName}{" "}
            {result.lastName}
          </p>
          <p className="text-gray-800 text-sm">
            <span className="font-semibold">Role:</span>{" "}
            <span
              className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                result.role === "ADMIN"
                  ? "bg-red-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              {result.role}
            </span>
          </p>
        </div>
      )}

      {/* ❌ Error Card */}
      {error && (
        <div className="mt-6 w-full max-w-sm bg-red-100 border border-red-400 rounded-2xl shadow p-5 text-center animate-fade-in">
          <h2 className="text-lg font-bold text-red-800 mb-2">
            ❌ Verification Failed
          </h2>
          <p className="text-gray-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
