import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";

type Sub = {
  id: string;
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
};

function isActive(s: Sub | null) {
  if (!s) return false;
  const future = !s.current_period_end || new Date(s.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(s.status) && future) return true;
  if (s.status === "canceled" && future) return true;
  return false;
}

export function useSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setSub(null);
      setLoading(false);
      return;
    }
    const env = getStripeEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("id,status,price_id,current_period_end,cancel_at_period_end,environment")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub((data as Sub) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return { subscription: sub, isActive: isActive(sub), loading, refetch };
}
