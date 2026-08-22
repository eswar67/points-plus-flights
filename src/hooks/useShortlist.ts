import { useCallback, useEffect, useState } from "react";
import type { AwardItinerary } from "@/lib/awards/types";

const KEY = "me:shortlist";
const MAX = 25;

export type ShortlistItem = {
  id: string;
  savedAt: number;
  award: AwardItinerary;
};

function read(): ShortlistItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShortlistItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: ShortlistItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    // Notify other components in the same tab
    window.dispatchEvent(new CustomEvent("me:shortlist-changed"));
  } catch {
    /* quota — ignore */
  }
}

export function useShortlist() {
  const [items, setItems] = useState<ShortlistItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("me:shortlist-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("me:shortlist-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const has = useCallback((id: string) => items.some((it) => it.id === id), [items]);

  const toggle = useCallback((award: AwardItinerary) => {
    const current = read();
    const exists = current.some((it) => it.id === award.id);
    let next: ShortlistItem[];
    if (exists) {
      next = current.filter((it) => it.id !== award.id);
    } else {
      next = [{ id: award.id, savedAt: Date.now(), award }, ...current].slice(0, MAX);
    }
    write(next);
    setItems(next);
    return !exists; // true if we just saved
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((it) => it.id !== id);
    write(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, has, toggle, remove, clear };
}
