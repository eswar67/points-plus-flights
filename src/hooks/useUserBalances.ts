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

/**
 * Fetches the signed-in user's manually-entered program balances. Returns
 * an empty list (and an empty `byProgramId` map) when signed out, so callers
 * can use it unconditionally without crashing.
 */
export function useUserBalances() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setBalances([]);
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
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const byProgramId: Record<string, number> = {};
  for (const b of balances) byProgramId[b.program_id] = b.balance;

  return { balances, byProgramId, loading, refetch };
}