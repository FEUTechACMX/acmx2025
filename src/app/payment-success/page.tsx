"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentSuccess() {
  const params = useSearchParams();
  const registrationId = params.get("registrationId");

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold text-green-600">
        🎉 Payment Successful!
      </h1>
      <p className="text-gray-700 mt-3">
        Your registration has been confirmed and saved.
      </p>
      {registrationId && (
        <p className="text-gray-500 mt-2 text-sm">Reference: {registrationId}</p>
      )}
    </div>
  );
}
