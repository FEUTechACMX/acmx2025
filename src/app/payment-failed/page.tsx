export default function PaymentFailed() {
  return (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <h1 className="text-3xl font-bold text-red-600">❌ Payment Failed</h1>
      <p className="text-gray-700 mt-3">
        Your payment was not completed. Please try registering again.
      </p>
    </div>
  );
}
