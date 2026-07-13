import type { QuoteLineItem, QuoteStatus } from "@/lib/database.types";
import { lineTotalCents, taxCents } from "@/lib/money";

/** Recompute a line's total from qty × rate (integer cents). */
export function normalizeLineItem(item: QuoteLineItem): QuoteLineItem {
  const qty = Number.isFinite(item.qty) ? item.qty : 0;
  const rate_cents = Number.isFinite(item.rate_cents) ? item.rate_cents : 0;
  return {
    description: item.description?.trim() ?? "",
    qty,
    rate_cents,
    total_cents: lineTotalCents(qty, rate_cents),
    price_item_id: item.price_item_id ?? null,
  };
}

/** Compute subtotal / tax / total (all integer cents) for a quote. */
export function computeQuoteTotals(
  lineItems: QuoteLineItem[],
  taxRate: number,
): { subtotal_cents: number; tax_cents: number; total_cents: number } {
  const subtotal_cents = lineItems.reduce(
    (sum, li) => sum + lineTotalCents(li.qty, li.rate_cents),
    0,
  );
  const tax_cents = taxCents(subtotal_cents, taxRate);
  return { subtotal_cents, tax_cents, total_cents: subtotal_cents + tax_cents };
}

/** Whether a quote can still be acted on from its public page. */
export function isQuoteActionable(status: QuoteStatus): boolean {
  return status === "sent";
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

export function quoteStatusLabel(status: QuoteStatus): string {
  return STATUS_LABELS[status];
}

/** Tailwind classes for a status badge. */
export function quoteStatusClasses(status: QuoteStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "sent":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "declined":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "expired":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "draft":
    default:
      return "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
  }
}
