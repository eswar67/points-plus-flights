import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserBalance = {
  id: string;
  program_id: string;
  program_name: string;
  balance: number;
  note: string | null;
  updated_at: string;
};

const LS_KEY = "miles-expert:balances-v1";

function loadLocal(): UserBalance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserBalance[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(list: UserBalance[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(list));
    // Notify same-tab listeners.
    window.dispatchEvent(new CustomEvent("miles-expert:balances-changed"));
  } catch {
    /* ignore quota */
  }
}

/**
 * Guest-first balance store. When signed out, balances live in localStorage
 * so the site is fully usable without an account. When signed in, we keep
 * reading/writing Supabase as before.
 */
export function useUserBalances() {
  const { user, loading: authLoading } = useAuth();
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      const list = loadLocal().sort((a, b) => b.balance - a.balance);
      setBalances(list);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_program_balances")
      .select("id, program_id, program_name, balance, note, updated_at")
      .eq("user_id", user.id)
      .order("balance", { ascending: false });
    setBalances((data as UserBalance[]) ?? []);
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Keep guest state in sync across tabs / other components on the page.
  useEffect(() => {
    if (user) return;
    const onChange = () => setBalances(loadLocal().sort((a, b) => b.balance - a.balance));
    window.addEventListener("storage", onChange);
    window.addEventListener("miles-expert:balances-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("miles-expert:balances-changed", onChange);
    };
  }, [user]);

  const addBalance = useCallback(
    async (input: { program_id: string; program_name: string; balance: number }) => {
      if (user) {
        const { error } = await supabase.from("user_program_balances").insert({
          user_id: user.id,
          program_id: input.program_id,
          program_name: input.program_name,
          balance: input.balance,
        });
        if (error) throw error;
        await refetch();
        return;
      }
      const list = loadLocal();
      // Replace if program already exists.
      const rest = list.filter((b) => b.program_id !== input.program_id);
      rest.push({
        id: `local-${input.program_id}-${Date.now()}`,
        program_id: input.program_id,
        program_name: input.program_name,
        balance: input.balance,
        note: null,
        updated_at: new Date().toISOString(),
      });
      saveLocal(rest);
    },
    [user, refetch],
  );

  const updateBalance = useCallback(
    async (id: string, balance: number) => {
      if (user) {
        await supabase.from("user_program_balances").update({ balance }).eq("id", id);
        await refetch();
        return;
      }
      const list = loadLocal().map((b) =>
        b.id === id ? { ...b, balance, updated_at: new Date().toISOString() } : b,
      );
      saveLocal(list);
    },
    [user, refetch],
  );

  const removeBalance = useCallback(
    async (id: string) => {
      if (user) {
        await supabase.from("user_program_balances").delete().eq("id", id);
        await refetch();
        return;
      }
      saveLocal(loadLocal().filter((b) => b.id !== id));
    },
    [user, refetch],
  );

  const byProgramId: Record<string, number> = {};
  for (const b of balances) byProgramId[b.program_id] = b.balance;

  return {
    balances,
    byProgramId,
    loading,
    refetch,
    addBalance,
    updateBalance,
    removeBalance,
    isGuest: !user,
  };
}
