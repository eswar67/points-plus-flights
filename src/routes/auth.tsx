import { createFileRoute, redirect } from "@tanstack/react-router";

// Miles Expert is login-free. Any lingering /auth links bounce home.
// validateSearch accepts (and discards) legacy params so an old link
// with ?redirect=... can never throw a router validation error.
export const Route = createFileRoute("/auth")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
