import { createFileRoute, redirect } from "@tanstack/react-router";

// Concierge queue is not offered. Bounce home.
export const Route = createFileRoute("/concierge")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
