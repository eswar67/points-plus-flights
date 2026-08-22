import { createFileRoute, redirect } from "@tanstack/react-router";

// Agent access is not offered. Bounce home.
export const Route = createFileRoute("/agent-login")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
