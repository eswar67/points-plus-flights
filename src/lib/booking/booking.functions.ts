import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RequestSchema = z.object({
  contact_email: z.string().trim().email().max(255),
  contact_name: z.string().trim().min(1).max(120),
  passenger_count: z.number().int().min(1).max(9),
  route_from: z.string().trim().min(3).max(7).regex(/^[A-Za-z]+$/),
  route_to: z.string().trim().min(3).max(7).regex(/^[A-Za-z]+$/),
  travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cabin: z.enum(["economy", "premium", "business", "first"]),
  program: z.string().trim().min(1).max(60),
  carrier: z.string().trim().max(120).optional().nullable(),
  miles_required: z.number().int().min(0).max(2_000_000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const submitBookingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Gate: must have an active Aureum Plus subscription (sandbox or live).
    // Check both environments — the column defaults to 'sandbox' but we want
    // the gate to hold once the project goes live too.
    const { data: hasSandbox } = await supabaseAdmin.rpc("has_active_subscription", {
      user_uuid: userId,
      check_env: "sandbox",
    });
    const { data: hasLive } = await supabaseAdmin.rpc("has_active_subscription", {
      user_uuid: userId,
      check_env: "live",
    });
    if (!hasSandbox && !hasLive) {
      throw new Error(
        "Concierge booking is an Aureum Plus benefit. Upgrade at /pricing to submit a request."
      );
    }

    const { error, data: row } = await supabaseAdmin
      .from("booking_requests")
      .insert({
        ...data,
        route_from: data.route_from.toUpperCase(),
        route_to: data.route_to.toUpperCase(),
        user_id: userId,
      })
      .select("id, created_at")
      .single();
    if (error) {
      console.error("[submitBookingRequest]", error);
      throw new Error("Could not submit request. Please try again.");
    }
    return { id: row.id, created_at: row.created_at };
  });