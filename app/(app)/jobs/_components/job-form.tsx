"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { RecurFreq } from "@/lib/database.types";
import type { JobFormState } from "../actions";

type Action = (
  prev: JobFormState,
  formData: FormData,
) => Promise<JobFormState>;

export type JobFormInitial = {
  client_id?: string;
  title?: string;
  date?: string; // scheduled_date (one-off) or anchor_date (series)
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
  assigned_to?: string[];
  freq?: RecurFreq;
  interval_count?: number;
  until_date?: string | null;
};

const initialState: JobFormState = { error: null };
const inputClass =
  "h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900";

export function JobForm({
  action,
  assignees,
  clients,
  fixedClient,
  initial,
  showRepeatToggle,
  initialRepeats = false,
  lockRepeat = false,
  submitLabel,
  cancelHref,
}: {
  action: Action;
  assignees: { id: string; full_name: string }[];
  clients?: { id: string; name: string }[];
  fixedClient?: { id: string; name: string };
  initial?: JobFormInitial;
  showRepeatToggle?: boolean;
  initialRepeats?: boolean;
  lockRepeat?: boolean;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [repeats, setRepeats] = useState(initialRepeats);
  const assigned = new Set(initial?.assigned_to ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-5 p-4">
      {/* Client */}
      {fixedClient ? (
        <>
          <input type="hidden" name="client_id" value={fixedClient.id} />
          <div className="rounded-lg bg-neutral-100 px-3 py-2.5 text-sm dark:bg-neutral-800">
            Client: <span className="font-semibold">{fixedClient.name}</span>
          </div>
        </>
      ) : (
        <Field label="Client *">
          <select
            name="client_id"
            required
            defaultValue={initial?.client_id ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a client…
            </option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Title *">
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="e.g. Weekly mow"
          className={inputClass}
        />
      </Field>

      {/* Repeats toggle */}
      {(showRepeatToggle || lockRepeat) && (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="repeats"
            checked={repeats}
            disabled={lockRepeat}
            onChange={(e) => setRepeats(e.target.checked)}
            className="h-5 w-5 rounded border-neutral-300 accent-green-700"
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Repeats on a schedule
          </span>
        </label>
      )}

      <Field label={repeats ? "Starts on *" : "Date *"}>
        <input
          type="date"
          name="scheduled_date"
          required
          defaultValue={initial?.date ?? ""}
          className={inputClass}
        />
      </Field>

      {repeats && (
        <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex gap-3">
            <Field label="Every">
              <input
                type="number"
                name="interval_count"
                min={1}
                defaultValue={initial?.interval_count ?? 1}
                className={inputClass}
              />
            </Field>
            <Field label="Frequency">
              <select
                name="freq"
                defaultValue={initial?.freq ?? "weekly"}
                className={inputClass}
              >
                <option value="daily">day(s)</option>
                <option value="weekly">week(s)</option>
                <option value="monthly">month(s)</option>
              </select>
            </Field>
          </div>
          <Field label="Until (optional — blank = until cancelled)">
            <input
              type="date"
              name="until_date"
              defaultValue={initial?.until_date ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <div className="flex gap-3">
        <Field label="Time (optional)">
          <input
            type="time"
            name="scheduled_time"
            defaultValue={initial?.scheduled_time ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Duration (min)">
          <input
            type="number"
            name="duration_minutes"
            min={1}
            defaultValue={initial?.duration_minutes ?? ""}
            placeholder="e.g. 45"
            className={inputClass}
          />
        </Field>
      </div>

      {assignees.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Assign to
          </legend>
          <div className="flex flex-wrap gap-2">
            {assignees.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
              >
                <input
                  type="checkbox"
                  name="assigned_to"
                  value={a.id}
                  defaultChecked={assigned.has(a.id)}
                  className="h-4 w-4 rounded accent-green-700"
                />
                {a.full_name || "Unnamed"}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="Gate codes, instructions…"
          className={`${inputClass} h-auto py-2.5`}
        />
      </Field>

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  );
}
