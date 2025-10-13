"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccess() {
  const params = useSearchParams();

  useEffect(() => {
    const payload = params.get("payload");
    if (!payload) return;

    const registrationData = JSON.parse(decodeURIComponent(payload));

    // 🔹 Save registration to the backend
    fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save registration");
        return res.json();
      })
      .then(() => console.log("✅ Registration saved"))
      .catch((err) => console.error("❌ Error saving registration:", err));
  }, [params]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold text-green-600">
        🎉 Payment Successful!
      </h1>
      <p className="text-gray-700 mt-3">
        Your registration has been confirmed and saved.
      </p>
    </div>
  );
}
