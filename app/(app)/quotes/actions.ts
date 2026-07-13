"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { getBaseUrl } from "@/lib/url";
import { computeQuoteTotals, normalizeLineItem } from "@/lib/quotes";
import { sendEmail } from "@/lib/email/send";
import { quoteEmail } from "@/lib/email/templates";
import { businessName } from "@/lib/settings";
import type { QuoteLineItem } from "@/lib/database.types";

export type QuoteFormState = { error: string | null };

function parseQuoteForm(formData: FormData): {
  lineItems: QuoteLineItem[];
  taxRate: number;
  notes: string | null;
  validUntil: string | null;
} {
  let raw: unknown = [];
  try {
    raw = JSON.parse(String(formData.get("line_items") ?? "[]"));
  } catch {
    raw = [];
  }
  const lineItems = (Array.isArray(raw) ? raw : [])
    .map((li) => normalizeLineItem(li as QuoteLineItem))
    .filter((li) => li.description !== "" || li.total_cents !== 0);

  // Tax entered as a percentage in the UI (e.g. 7 => 0.07).
  const taxPct = parseFloat(String(formData.get("tax_rate") ?? "0"));
  const taxRate = Number.isFinite(taxPct) ? Math.max(0, taxPct) / 100 : 0;

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const validUntil = String(formData.get("valid_until") ?? "").trim() || null;

  return { lineItems, taxRate, notes, validUntil };
}

export async function createQuoteAction(
  clientId: string,
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  await requireOwner();
  const { lineItems, taxRate, notes, validUntil } = parseQuoteForm(formData);
  if (lineItems.length === 0) {
    return { error: "Add at least one line item." };
  }
  const totals = computeQuoteTotals(lineItems, taxRate);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      client_id: clientId,
      status: "draft",
      line_items: lineItems,
      tax_rate: taxRate,
      notes,
      valid_until: validUntil,
      ...totals,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not save the quote." };

  revalidatePath(`/clients/${clientId}`);
  redirect(`/quotes/${data.id}`);
}

export async function updateQuoteAction(
  id: string,
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  await requireOwner();
  const { lineItems, taxRate, notes, validUntil } = parseQuoteForm(formData);
  if (lineItems.length === 0) {
    return { error: "Add at least one line item." };
  }
  const totals = computeQuoteTotals(lineItems, taxRate);

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({
      line_items: lineItems,
      tax_rate: taxRate,
      notes,
      valid_until: validUntil,
      ...totals,
    })
    .eq("id", id);

  if (error) return { error: "Could not save changes." };

  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

/**
 * Mark a quote sent (activating its public page) and email it to the client if
 * possible. Sending always activates the link; email is best-effort.
 */
export async function sendQuoteAction(id: string) {
  await requireOwner();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, clients(name, email)")
    .eq("id", id)
    .single();

  if (!quote) redirect("/clients");

  await supabase
    .from("quotes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  const client = quote.clients as { name: string; email: string | null } | null;
  const base = await getBaseUrl();
  const publicUrl = `${base}/q/${quote.public_token}`;

  let emailed = false;
  if (client?.email) {
    const { subject, html } = quoteEmail({
      businessName: businessName(),
      clientName: client.name,
      lineItems: quote.line_items,
      totalCents: quote.total_cents,
      publicUrl,
    });
    const result = await sendEmail({ to: client.email, subject, html });
    emailed = result.ok;
  }

  revalidatePath(`/quotes/${id}`);
  // Reflect what actually happened: a real email vs. a link to share manually.
  redirect(`/quotes/${id}?sent=${emailed ? "email" : "link"}`);
}

/** Owner manually sets an approved/declined/expired status. */
export async function setQuoteStatusAction(
  id: string,
  status: "approved" | "declined" | "expired",
) {
  await requireOwner();
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("quotes")
    .update({
      status,
      approved_at: status === "approved" ? now : null,
      declined_at: status === "declined" ? now : null,
    })
    .eq("id", id);
  revalidatePath(`/quotes/${id}`);
}

export async function deleteQuoteAction(id: string, clientId: string) {
  await requireOwner();
  const supabase = await createClient();
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
