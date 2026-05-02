const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full bg-amber-100/90 border-b border-amber-300 px-4 py-2 text-center text-xs text-amber-900">
      Payments preview — test mode. Use card{" "}
      <span className="font-mono">4242 4242 4242 4242</span> with any future expiry & any CVC.
    </div>
  );
}
