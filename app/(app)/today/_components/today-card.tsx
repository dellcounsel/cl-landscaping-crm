"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { JobStatus } from "@/lib/database.types";
import { formatTime, mapsUrl } from "@/lib/jobs";
import { MapPinIcon } from "../../_components/icons";
import { markJobDone } from "../../jobs/actions";

export function TodayCard({
  job,
}: {
  job: {
    id: string;
    title: string;
    scheduled_time: string | null;
    notes: string | null;
    status: JobStatus;
    client_name: string;
    address: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const done = job.status === "done";
  const time = formatTime(job.scheduled_time);

  return (
    <div
      className={`rounded-2xl border p-4 ${
        done
          ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={`/jobs/${job.id}`} className="min-w-0">
          <p className={`text-lg font-semibold ${done ? "line-through opacity-60" : ""}`}>
            {job.client_name}
          </p>
          <p className="truncate text-sm text-neutral-500">
            {job.title}
            {time ? ` · ${time}` : ""}
          </p>
        </Link>
        {done && (
          <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Done
          </span>
        )}
      </div>

      {job.address && (
        <a
          href={mapsUrl(job.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-500"
        >
          <MapPinIcon className="h-4 w-4" />
          {job.address}
        </a>
      )}

      {job.notes && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
          {job.notes}
        </p>
      )}

      {!done && !noting && (
        <button
          type="button"
          onClick={() => setNoting(true)}
          className="mt-3 h-12 w-full rounded-xl bg-green-700 text-base font-semibold text-white hover:bg-green-800 active:bg-green-900"
        >
          Mark done
        </button>
      )}

      {noting && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional note"
            className="mb-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
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
                  await markJobDone(job.id, note);
                  setNoting(false);
                  setNote("");
                })
              }
              className="h-11 flex-1 rounded-lg bg-green-700 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
