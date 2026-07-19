"use client";

import { useState, useTransition } from "react";
import type { JobStatus } from "@/lib/database.types";
import {
  markJobDone,
  setJobStatus,
  skipJob,
  rescheduleJob,
  deleteJobAction,
} from "../../actions";

export function JobActions({
  id,
  clientId,
  status,
  isOwner,
}: {
  id: string;
  clientId: string;
  status: JobStatus;
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const done = status === "done";
  const inProgress = status === "in_progress";

  return (
    <div className="flex flex-col gap-3">
      {/* Primary: mark done / note flow (crew + owner) */}
      {!done && !noting && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setNoting(true)}
          className="h-14 w-full rounded-xl bg-green-700 text-lg font-semibold text-white hover:bg-green-800 active:bg-green-900 disabled:opacity-60"
        >
          Mark done
        </button>
      )}

      {noting && (
        <div className="rounded-xl border border-neutral-300 p-3 dark:border-neutral-700">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Optional note (what you did, issues…)"
            className="mb-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNoting(false)}
              className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markJobDone(id, note);
                  setNoting(false);
                  setNote("");
                })
              }
              className="h-11 flex-1 rounded-lg bg-green-700 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Mark done"}
            </button>
          </div>
        </div>
      )}

      {/* Secondary status toggles */}
      <div className="flex gap-2">
        {done ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setJobStatus(id, "scheduled"))}
            className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold disabled:opacity-60 dark:border-neutral-700"
          >
            Reopen
          </button>
        ) : inProgress ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setJobStatus(id, "scheduled"))}
            className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold disabled:opacity-60 dark:border-neutral-700"
          >
            Back to scheduled
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setJobStatus(id, "in_progress"))}
            className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold disabled:opacity-60 dark:border-neutral-700"
          >
            Start
          </button>
        )}
      </div>

      {/* Owner-only scheduling controls */}
      {isOwner && (
        <div className="mt-1 flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          {rescheduling ? (
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-11 flex-1 rounded-lg border border-neutral-300 px-3 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <button
                type="button"
                disabled={pending || !newDate}
                onClick={() =>
                  startTransition(async () => {
                    await rescheduleJob(id, newDate);
                    setRescheduling(false);
                  })
                }
                className="h-11 rounded-lg bg-neutral-800 px-4 text-sm font-semibold text-white disabled:opacity-60 dark:bg-neutral-200 dark:text-neutral-900"
              >
                Move
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRescheduling(true)}
                className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
              >
                Reschedule
              </button>
              {status !== "skipped" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => skipJob(id))}
                  className="h-11 flex-1 rounded-lg border border-amber-300 text-sm font-semibold text-amber-700 disabled:opacity-60 dark:border-amber-900/50 dark:text-amber-400"
                >
                  Skip
                </button>
              )}
            </div>
          )}

          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-11 flex-1 rounded-lg border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deleteJobAction(id, clientId))}
                className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full rounded-lg text-sm font-semibold text-red-600"
            >
              Delete job
            </button>
          )}
        </div>
      )}
    </div>
  );
}
