import type { QuoteLineItem } from "@/lib/database.types";
import { formatCents } from "@/lib/money";

/** Read-only line items + totals. Shared by the owner detail and public pages. */
export function QuoteSummary({
  lineItems,
  subtotalCents,
  taxRate,
  taxCents,
  totalCents,
}: {
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  taxRate: number;
  taxCents: number;
  totalCents: number;
}) {
  const taxPct = +(taxRate * 100).toFixed(4);
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {lineItems.map((li, i) => (
          <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium">{li.description || "—"}</p>
              <p className="text-sm text-neutral-500">
                {li.qty} × {formatCents(li.rate_cents)}
              </p>
            </div>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatCents(li.total_cents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex justify-between py-0.5 text-sm">
          <span className="text-neutral-500">Subtotal</span>
          <span className="tabular-nums">{formatCents(subtotalCents)}</span>
        </div>
        <div className="flex justify-between py-0.5 text-sm">
          <span className="text-neutral-500">Tax ({taxPct}%)</span>
          <span className="tabular-nums">{formatCents(taxCents)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCents(totalCents)}
          </span>
        </div>
      </div>
    </div>
  );
}
