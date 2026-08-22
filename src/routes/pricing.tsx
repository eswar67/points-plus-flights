import { createFileRoute, redirect } from "@tanstack/react-router";

// Commercial features are switched off. Bounce home.
export const Route = createFileRoute("/pricing")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
