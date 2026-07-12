"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Client } from "@/lib/database.types";
import type { ClientFormState } from "../actions";

type Action = (
  prev: ClientFormState,
  formData: FormData,
) => Promise<ClientFormState>;

const initialState: ClientFormState = { error: null };

const inputClass =
  "h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ClientForm({
  action,
  client,
  submitLabel,
}: {
  action: Action;
  client?: Client;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = client ? `/clients/${client.id}` : "/clients";

  return (
    <form action={formAction} className="flex flex-col gap-5 p-4">
      <Field label="Name *">
        <input
          name="name"
          required
          defaultValue={client?.name ?? ""}
          autoComplete="name"
          className={inputClass}
        />
      </Field>

      <Field label="Phone">
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={client?.phone ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Email">
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={client?.email ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Property address">
        <input
          name="property_address"
          defaultValue={client?.property_address ?? ""}
          placeholder="Where the work happens"
          className={inputClass}
        />
      </Field>

      <Field label="Billing address">
        <input
          name="billing_address"
          defaultValue={client?.billing_address ?? ""}
          placeholder="If different from property"
          className={inputClass}
        />
      </Field>

      <Field label="Tags">
        <input
          name="tags"
          defaultValue={client?.tags?.join(", ") ?? ""}
          placeholder="Comma separated, e.g. weekly, commercial"
          className={inputClass}
        />
      </Field>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={4}
          defaultValue={client?.notes ?? ""}
          className={`${inputClass} h-auto py-2.5`}
        />
      </Field>

      <Field label="Status">
        <select
          name="status"
          defaultValue={client?.status ?? "active"}
          className={inputClass}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>

      {state.error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
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
