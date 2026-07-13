"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getBaseUrl } from "@/lib/url";
import { sendEmail } from "@/lib/email/send";
import { ownerQuoteResponseEmail } from "@/lib/email/templates";
import { ownerNotifyEmail } from "@/lib/settings";

/**
 * Public approve/decline for a quote, looked up strictly by its unguessable
 * token. Uses the service-role client (no user session on public pages) and
 * only acts on a quote that is currently 'sent', so links can't be replayed to
 * flip an already-decided quote.
 */
async function respond(token: string, approve: boolean) {
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, total_cents, clients(name)")
    .eq("public_token", token)
    .single();

  if (!quote || quote.status !== "sent") {
    redirect(`/q/${token}`);
  }

  const now = new Date().toISOString();
  await supabase
    .from("quotes")
    .update(
      approve
        ? { status: "approved", approved_at: now }
        : { status: "declined", declined_at: now },
    )
    .eq("public_token", token)
    .eq("status", "sent");

  // Best-effort owner notification.
  const notify = ownerNotifyEmail();
  if (notify) {
    const client = quote.clients as { name: string } | null;
    const base = await getBaseUrl();
    const { subject, html } = ownerQuoteResponseEmail({
      clientName: client?.name ?? "A client",
      approved: approve,
      totalCents: quote.total_cents,
      quoteUrl: `${base}/quotes/${quote.id}`,
    });
    await sendEmail({ to: notify, subject, html });
  }

  revalidatePath(`/q/${token}`);
  redirect(`/q/${token}`);
}

export async function approveQuote(token: string) {
  await respond(token, true);
}

export async function declineQuote(token: string) {
  await respond(token, false);
}
