/**
 * Email alerts via Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Configure RESEND_API_KEY, and optionally ALERTS_FROM_EMAIL for a verified
 * sender ("Miles Expert Alerts <alerts@yourdomain.com>").
 */

const RESEND_URL = "https://api.resend.com/emails";

export function emailAlertsConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendAlertEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env.ALERTS_FROM_EMAIL || "Miles Expert Alerts <onboarding@resend.dev>";

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend send failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}
