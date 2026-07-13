"use client";

import { useState, useTransition } from "react";
import { approveQuote, declineQuote } from "../actions";

export function RespondButtons({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmDecline, setConfirmDecline] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => approveQuote(token))}
        className="h-14 w-full rounded-xl bg-green-700 text-lg font-semibold text-white hover:bg-green-800 active:bg-green-900 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Approve quote"}
      </button>

      {confirmDecline ? (
        <div className="rounded-xl border border-neutral-300 p-3 dark:border-neutral-700">
          <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">
            Decline this quote?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDecline(false)}
              className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => declineQuote(token))}
              className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Yes, decline"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmDecline(true)}
          className="h-12 w-full rounded-xl border border-neutral-300 text-base font-semibold text-neutral-700 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200"
        >
          Decline
        </button>
      )}
    </div>
  );
}
