"use client";

import { useState } from "react";
import { deleteClientAction } from "../../actions";

export function DeleteClientButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const deleteWithId = deleteClientAction.bind(null, id);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-12 w-full rounded-lg border border-red-200 text-base font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
      >
        Delete client
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 p-4 dark:border-red-900/50">
      <p className="mb-3 text-sm text-neutral-700 dark:text-neutral-300">
        Delete this client permanently? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
        >
          Cancel
        </button>
        <form action={deleteWithId} className="flex-1">
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
