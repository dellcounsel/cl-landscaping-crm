import type { QuoteLineItem } from "@/lib/database.types";
import { formatCents } from "@/lib/money";

const BRAND = "#166534";

function layout(inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#171717">
${inner}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0 12px"/>
<p style="font-size:12px;color:#8a8a8a;margin:0">Sent by FieldBook</p>
</div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${label}</a>`;
}

function lineItemsTable(items: QuoteLineItem[]): string {
  const rows = items
    .map(
      (li) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${escapeHtml(li.description)}</td>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap">${li.qty} × ${formatCents(li.rate_cents)}</td>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;font-weight:600">${formatCents(li.total_cents)}</td>
</tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">${rows}</table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email to the client with the quote total + link to the public approval page. */
export function quoteEmail(params: {
  businessName: string;
  clientName: string;
  lineItems: QuoteLineItem[];
  totalCents: number;
  publicUrl: string;
}): { subject: string; html: string } {
  const subject = `Your quote from ${params.businessName} — ${formatCents(params.totalCents)}`;
  const html = layout(`
<h1 style="font-size:20px;margin:0 0 8px">Hi ${escapeHtml(params.clientName)},</h1>
<p style="font-size:15px;line-height:1.5;margin:0 0 4px">Here's your quote from <strong>${escapeHtml(params.businessName)}</strong>.</p>
${lineItemsTable(params.lineItems)}
<p style="font-size:18px;font-weight:700;margin:0 0 20px">Total: ${formatCents(params.totalCents)}</p>
<p style="margin:0 0 20px">${button(params.publicUrl, "Review &amp; approve")}</p>
<p style="font-size:13px;color:#8a8a8a;margin:0">Or open this link: <a href="${params.publicUrl}" style="color:${BRAND}">${params.publicUrl}</a></p>
`);
  return { subject, html };
}

/** Email to the owner when a client approves or declines a quote. */
export function ownerQuoteResponseEmail(params: {
  clientName: string;
  approved: boolean;
  totalCents: number;
  quoteUrl: string;
}): { subject: string; html: string } {
  const verb = params.approved ? "approved" : "declined";
  const subject = `${params.clientName} ${verb} a quote — ${formatCents(params.totalCents)}`;
  const html = layout(`
<h1 style="font-size:20px;margin:0 0 8px">Quote ${verb}</h1>
<p style="font-size:15px;line-height:1.5;margin:0 0 16px"><strong>${escapeHtml(params.clientName)}</strong> ${verb} their quote for <strong>${formatCents(params.totalCents)}</strong>.</p>
<p style="margin:0">${button(params.quoteUrl, "View quote")}</p>
`);
  return { subject, html };
}
