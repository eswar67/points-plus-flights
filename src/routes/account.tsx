import { createFileRoute, redirect } from "@tanstack/react-router";

// Miles Expert is login-free; balances live on the home page.
export const Route = createFileRoute("/account")({
  validateSearch: () => ({}),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
