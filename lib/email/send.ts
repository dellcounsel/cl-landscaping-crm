/**
 * Minimal Resend email sender over the HTTP API (no SDK dependency).
 * If RESEND_API_KEY is unset it no-ops and reports `skipped` — the app stays
 * fully usable before email is configured (quotes still produce a public link
 * the owner can share manually).
 */

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true }
  | { ok: false; skipped: false; error: string };

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, skipped: true };

  // Default to Resend's shared testing sender until a domain is verified.
  const from = process.env.EMAIL_FROM || "FieldBook <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, skipped: false, error: `Resend ${res.status}: ${body}` };
    }
    const data = (await res.json()) as { id: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
