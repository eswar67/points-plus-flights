import { createFileRoute, redirect } from "@tanstack/react-router";

// Watchlists need an account; Miles Expert is login-free for now.
export const Route = createFileRoute("/watchlists")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
