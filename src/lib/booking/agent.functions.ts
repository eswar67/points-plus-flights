import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listBookingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[listBookingRequests]", error);
      throw new Error(error.message);
    }
    return { requests: data ?? [] };
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "ticketed", "cancelled"]),
  agent_notes: z.string().max(2000).optional().nullable(),
});

export const updateBookingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("booking_requests")
      .update({ status: data.status, agent_notes: data.agent_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });