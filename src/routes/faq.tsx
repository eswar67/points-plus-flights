import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FAQ } from "@/components/site/HomeSections";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Miles Expert award seat search" },
      {
        name: "description",
        content:
          "How Miles Expert finds award seats, which programs we cover, and how to follow the redemption playbook.",
      },
      { property: "og:title", content: "FAQ — Miles Expert" },
      {
        property: "og:description",
        content: "Everything you need to know about Miles Expert's award seat search.",
      },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="pt-10">
        <div className="mx-auto max-w-4xl px-6 pt-12 text-center">
          <span className="text-xs uppercase tracking-widest text-gold">Help</span>
          <h1 className="font-display text-5xl md:text-6xl mt-3 leading-[1.02]">
            Frequently asked.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about searching award seats, tracking availability, and
            following the redemption playbook.
          </p>
        </div>
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
