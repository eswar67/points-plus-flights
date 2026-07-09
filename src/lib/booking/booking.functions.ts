import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RequestSchema = z.object({
  contact_email: z.string().trim().email().max(255),
  contact_name: z.string().trim().min(1).max(120),
  passenger_count: z.number().int().min(1).max(9),
  route_from: z
    .string()
    .trim()
    .min(3)
    .max(7)
    .regex(/^[A-Za-z]+$/),
  route_to: z
    .string()
    .trim()
    .min(3)
    .max(7)
    .regex(/^[A-Za-z]+$/),
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
        "Concierge booking is an Aureum Plus benefit. Upgrade at /pricing to submit a request.",
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

    // Best-effort notifications — a mail failure must never lose a booking.
    const { emailAlertsConfigured, sendAlertEmail } = await import("@/lib/alerts/email.server");
    if (emailAlertsConfigured()) {
      const ref = String(row.id).slice(0, 8);
      const summary =
        `<p style="margin:0 0 4px"><b>${data.route_from.toUpperCase()} → ${data.route_to.toUpperCase()}</b>` +
        ` · ${data.travel_date} · ${data.cabin} · ${data.passenger_count} pax</p>` +
        `<p style="margin:0 0 4px">Program: ${escapeHtml(data.program)}` +
        `${data.carrier ? ` · Carrier: ${escapeHtml(data.carrier)}` : ""}` +
        `${data.miles_required != null ? ` · Miles: ${data.miles_required.toLocaleString()}` : ""}</p>` +
        `${data.notes ? `<p style="margin:8px 0 0;font-style:italic">"${escapeHtml(data.notes)}"</p>` : ""}`;

      const agentInbox = process.env.CONCIERGE_INBOX_EMAIL;
      if (agentInbox) {
        try {
          await sendAlertEmail(
            agentInbox,
            `New booking request ${ref} — ${data.route_from.toUpperCase()} → ${data.route_to.toUpperCase()}`,
            `<div style="font-family:sans-serif;max-width:520px">` +
              `<h2 style="margin:0 0 10px">New concierge request ${ref}</h2>` +
              `<p style="margin:0 0 4px">${escapeHtml(data.contact_name)} · ${escapeHtml(data.contact_email)}</p>` +
              summary +
              `</div>`,
          );
        } catch (e) {
          console.error("[submitBookingRequest] agent notify failed:", (e as Error).message);
        }
      }
      try {
        await sendAlertEmail(
          data.contact_email,
          `Aureum booking request received — ref ${ref}`,
          `<div style="font-family:sans-serif;max-width:520px">` +
            `<h2 style="margin:0 0 10px">We're on it.</h2>` +
            `<p style="margin:0 0 10px">Thanks ${escapeHtml(data.contact_name)} — your request is in the concierge queue as ` +
            `<b>ref ${ref}</b>. An award specialist will reply with options.</p>` +
            summary +
            `<p style="margin:12px 0 0">Track it any time on your Requests page.</p>` +
            `</div>`,
        );
      } catch (e) {
        console.error("[submitBookingRequest] customer confirm failed:", (e as Error).message);
      }
    }

    return { id: row.id, created_at: row.created_at };
  });

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
