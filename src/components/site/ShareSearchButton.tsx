import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import type { Cabin } from "@/lib/awards/types";

export function ShareSearchButton({ from, to, cabin }: { from: string; to: string; cabin: Cabin }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.origin);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.set("cabin", cabin);
    const href = url.toString();
    const shareData = {
      title: `${from} → ${to} · ${cabin} award space`,
      text: `Award seats for ${from} → ${to} (${cabin}) on Miles Expert`,
      url: href,
    };
    try {
      if (navigator.share && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-live="polite"
      className="btn btn-ghost whitespace-nowrap"
    >
      {copied ? (
        <>
          <Check className="size-3.5" /> Copied
        </>
      ) : (
        <>
          <Share2 className="size-3.5" /> Share
        </>
      )}
    </button>
  );
}
