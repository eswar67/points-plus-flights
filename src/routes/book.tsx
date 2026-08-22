import { createFileRoute, redirect } from "@tanstack/react-router";

// Concierge booking is not offered. Bounce home.
export const Route = createFileRoute("/book")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
