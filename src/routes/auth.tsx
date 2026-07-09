import { createFileRoute, redirect } from "@tanstack/react-router";

// Miles Expert is login-free. Any lingering /auth links bounce home.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
