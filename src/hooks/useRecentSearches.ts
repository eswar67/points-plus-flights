import { useCallback, useEffect, useState } from "react";
import type { SearchFormQuery } from "@/components/site/SearchForm";

const KEY = "me:recent-searches";
const MAX = 6;

export type RecentSearch = SearchFormQuery & { at: number };

function read(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const push = useCallback((q: SearchFormQuery) => {
    setItems((cur) => {
      const key = `${q.from}-${q.to}-${q.cabin}`;
      const next: RecentSearch[] = [
        { ...q, at: Date.now() },
        ...cur.filter((r) => `${r.from}-${r.to}-${r.cabin}` !== key),
      ].slice(0, MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { items, push, clear };
}
