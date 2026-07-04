import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

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
      { title: "Aureum — Redeem Reward Points for Premium Flights" },
      { name: "description", content: "Connect Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles. Search live award availability and redeem your points in real time." },
      { name: "author", content: "Aureum" },
      { property: "og:title", content: "Aureum — Redeem Reward Points for Premium Flights" },
      { property: "og:description", content: "Connect Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles. Search live award availability and redeem your points in real time." },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#0d0d0d" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Aureum — Redeem Reward Points for Premium Flights" },
      { name: "twitter:description", content: "Connect Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles. Search live award availability and redeem your points in real time." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a4904d5-eb1a-4f89-b2c8-95fab043d374/id-preview-5b1b58cc--b115ba8d-a516-4282-8b1d-67964b225599.lovable.app-1777734897264.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a4904d5-eb1a-4f89-b2c8-95fab043d374/id-preview-5b1b58cc--b115ba8d-a516-4282-8b1d-67964b225599.lovable.app-1777734897264.png" },
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
  return <Outlet />;
}
