export default function PaymentFailed() {
  return (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-2">
        ❌ Payment Failed
      </h1>
      <p className="text-gray-700">Something went wrong. Please try again.</p>
    </div>
  );
}
