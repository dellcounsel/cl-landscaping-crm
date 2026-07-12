"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { PriceItem } from "@/lib/database.types";
import { centsToDollars } from "@/lib/money";
import type { PriceItemFormState } from "../actions";
import { DeletePriceItemButton } from "./delete-price-item-button";

type Action = (
  prev: PriceItemFormState,
  formData: FormData,
) => Promise<PriceItemFormState>;

const initialState: PriceItemFormState = { error: null };

const inputClass =
  "h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900";

export function PriceItemForm({
  action,
  item,
  submitLabel,
}: {
  action: Action;
  item?: PriceItem;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-6 p-4">
      <form action={formAction} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Name *
          </span>
          <input
            name="name"
            required
            defaultValue={item?.name ?? ""}
            placeholder="e.g. Weekly Mow"
            className={inputClass}
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Unit
            </span>
            <select
              name="unit"
              defaultValue={item?.unit ?? "flat"}
              className={inputClass}
            >
              <option value="flat">Flat</option>
              <option value="hour">Per hour</option>
              <option value="yard">Per yard</option>
              <option value="sqft">Per sq ft</option>
            </select>
          </label>

          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Default rate
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                $
              </span>
              <input
                name="default_rate"
                type="text"
                inputMode="decimal"
                defaultValue={
                  item ? centsToDollars(item.default_rate_cents).toFixed(2) : ""
                }
                placeholder="0.00"
                className={`${inputClass} pl-7`}
              />
            </div>
          </label>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="active"
            defaultChecked={item ? item.active : true}
            className="h-5 w-5 rounded border-neutral-300 accent-green-700"
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Active (available when building quotes & invoices)
          </span>
        </label>

        {state.error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Link
            href="/price-list"
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

      {item && (
        <div className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
          <DeletePriceItemButton id={item.id} />
        </div>
      )}
    </div>
  );
}
