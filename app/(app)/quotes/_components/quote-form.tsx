"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { PriceItem, Quote, QuoteLineItem } from "@/lib/database.types";
import { centsToDollars, formatCents, parseDollarsToCents } from "@/lib/money";
import { computeQuoteTotals } from "@/lib/quotes";
import type { QuoteFormState } from "../actions";

type Action = (
  prev: QuoteFormState,
  formData: FormData,
) => Promise<QuoteFormState>;

type EditableLine = {
  key: string;
  description: string;
  qty: number;
  rate_cents: number;
  price_item_id: string | null;
};

const initialState: QuoteFormState = { error: null };
const inputClass =
  "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900";

let keyCounter = 0;
const nextKey = () => `l${keyCounter++}`;

function toEditable(items: QuoteLineItem[]): EditableLine[] {
  return items.map((li) => ({
    key: nextKey(),
    description: li.description,
    qty: li.qty,
    rate_cents: li.rate_cents,
    price_item_id: li.price_item_id ?? null,
  }));
}

export function QuoteForm({
  action,
  priceItems,
  quote,
  cancelHref,
  submitLabel,
}: {
  action: Action;
  priceItems: Pick<PriceItem, "id" | "name" | "unit" | "default_rate_cents">[];
  quote?: Quote;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [lines, setLines] = useState<EditableLine[]>(
    quote && quote.line_items.length > 0
      ? toEditable(quote.line_items)
      : [{ key: nextKey(), description: "", qty: 1, rate_cents: 0, price_item_id: null }],
  );
  const [taxPct, setTaxPct] = useState<string>(
    quote ? String(+(quote.tax_rate * 100).toFixed(4)) : "0",
  );

  const serializedLines: QuoteLineItem[] = lines.map((l) => ({
    description: l.description,
    qty: l.qty,
    rate_cents: l.rate_cents,
    total_cents: Math.round(l.qty * l.rate_cents),
    price_item_id: l.price_item_id,
  }));

  const taxRate = (parseFloat(taxPct) || 0) / 100;
  const totals = useMemo(
    () => computeQuoteTotals(serializedLines, taxRate),
    [serializedLines, taxRate],
  );

  function updateLine(key: string, patch: Partial<EditableLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }
  function addBlank() {
    setLines((prev) => [
      ...prev,
      { key: nextKey(), description: "", qty: 1, rate_cents: 0, price_item_id: null },
    ]);
  }
  function addFromPriceItem(id: string) {
    const item = priceItems.find((p) => p.id === id);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        description: item.name,
        qty: 1,
        rate_cents: item.default_rate_cents,
        price_item_id: item.id,
      },
    ]);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 p-4">
      <input type="hidden" name="line_items" value={JSON.stringify(serializedLines)} />
      <input type="hidden" name="tax_rate" value={taxPct} />

      {/* Line items */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Line items
          </h2>
        </div>

        {lines.map((line) => (
          <div
            key={line.key}
            className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <input
              value={line.description}
              onChange={(e) =>
                updateLine(line.key, { description: e.target.value })
              }
              placeholder="Description"
              className={`${inputClass} mb-2`}
            />
            <div className="flex items-end gap-2">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-neutral-500">Qty</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={line.qty}
                  onChange={(e) =>
                    updateLine(line.key, { qty: parseFloat(e.target.value) || 0 })
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-neutral-500">Rate</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={
                      line.rate_cents
                        ? centsToDollars(line.rate_cents).toFixed(2)
                        : ""
                    }
                    onChange={(e) =>
                      updateLine(line.key, {
                        rate_cents: parseDollarsToCents(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    className={`${inputClass} pl-6`}
                  />
                </div>
              </label>
              <div className="w-20 pb-2 text-right">
                <span className="mb-1 block text-xs text-neutral-500">Total</span>
                <span className="font-semibold tabular-nums">
                  {formatCents(Math.round(line.qty * line.rate_cents))}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              className="mt-2 text-sm font-medium text-red-600"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addBlank}
            className="h-11 rounded-lg border border-neutral-300 px-4 text-sm font-semibold dark:border-neutral-700"
          >
            + Add line
          </button>
          {priceItems.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addFromPriceItem(e.target.value);
                e.target.value = "";
              }}
              className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">+ From price list…</option>
              {priceItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatCents(p.default_rate_cents)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tax + totals */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between py-1 text-sm">
          <span className="text-neutral-500">Subtotal</span>
          <span className="font-medium tabular-nums">
            {formatCents(totals.subtotal_cents)}
          </span>
        </div>
        <div className="flex items-center justify-between py-1 text-sm">
          <span className="flex items-center gap-2 text-neutral-500">
            Tax
            <span className="relative inline-block">
              <input
                type="text"
                inputMode="decimal"
                value={taxPct}
                onChange={(e) => setTaxPct(e.target.value)}
                className="h-8 w-16 rounded border border-neutral-300 pl-2 pr-5 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400">
                %
              </span>
            </span>
          </span>
          <span className="font-medium tabular-nums">
            {formatCents(totals.tax_cents)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCents(totals.total_cents)}
          </span>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Notes (optional)
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={quote?.notes ?? ""}
          placeholder="Shown on the quote"
          className={`${inputClass} h-auto py-2.5`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Valid until (optional)
        </span>
        <input
          type="date"
          name="valid_until"
          defaultValue={quote?.valid_until ?? ""}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Link
          href={cancelHref}
          className="flex h-12 flex-1 items-center justify-center rounded-lg border border-neutral-300 text-base font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="h-12 flex-1 rounded-lg bg-green-700 text-base font-semibold text-white hover:bg-green-800 active:bg-green-900 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
