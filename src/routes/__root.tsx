import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ShortlistDock } from "@/components/site/ShortlistDock";
import { CompareBar } from "@/components/site/CompareBar";

import appCss from "../styles.css?url";

// Absolute base for social-card URLs (scrapers ignore relative og:image).
// Set VITE_SITE_URL to the deployed origin, e.g. https://aureum.example.com
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const OG_IMAGE = `${SITE_URL}/og.png`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Miles Expert — Redeem Reward Points for Premium Flights" },
      {
        name: "description",
        content:
          "Track Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles in one vault. Search cached award space across programs, updated continuously, with a guided redemption playbook.",
      },
      { name: "author", content: "Miles Expert" },
      { property: "og:title", content: "Miles Expert — Redeem Reward Points for Premium Flights" },
      {
        property: "og:description",
        content:
          "Track Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles in one vault. Search cached award space across programs, updated continuously, with a guided redemption playbook.",
      },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#0d0d0d" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Miles Expert — Redeem Reward Points for Premium Flights" },
      {
        name: "twitter:description",
        content:
          "Track Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles in one vault. Search cached award space across programs, updated continuously, with a guided redemption playbook.",
      },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <ShortlistDock />
      <CompareBar />
    </>
  );
}
