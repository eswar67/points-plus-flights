import { createFileRoute, redirect } from "@tanstack/react-router";

// Checkout is switched off. Bounce home.
export const Route = createFileRoute("/checkout/return")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
