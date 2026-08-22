import { createFileRoute, redirect } from "@tanstack/react-router";

// Concierge requests are not offered. Bounce home.
export const Route = createFileRoute("/requests")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
