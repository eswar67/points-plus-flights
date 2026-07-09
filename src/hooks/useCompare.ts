import { useCallback, useEffect, useState } from "react";
import type { AwardItinerary } from "@/lib/awards/types";

const KEY = "me:compare";
export const COMPARE_MAX = 3;

function read(): AwardItinerary[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AwardItinerary[]) : [];
  } catch {
    return [];
  }
}

function write(items: AwardItinerary[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("me:compare-changed"));
  } catch {
    /* ignore */
  }
}

export function useCompare() {
  const [items, setItems] = useState<AwardItinerary[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("me:compare-changed", onChange);
    return () => window.removeEventListener("me:compare-changed", onChange);
  }, []);

  const has = useCallback(
    (id: string) => items.some((it) => it.id === id),
    [items],
  );

  const toggle = useCallback((award: AwardItinerary): "added" | "removed" | "full" => {
    const cur = read();
    if (cur.some((x) => x.id === award.id)) {
      const next = cur.filter((x) => x.id !== award.id);
      write(next);
      setItems(next);
      return "removed";
    }
    if (cur.length >= COMPARE_MAX) return "full";
    const next = [...cur, award];
    write(next);
    setItems(next);
    return "added";
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((x) => x.id !== id);
    write(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, has, toggle, remove, clear, full: items.length >= COMPARE_MAX };
}