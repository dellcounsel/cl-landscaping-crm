"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked; the input below lets the user copy manually.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="h-10 flex-1 truncate rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
      />
      <button
        type="button"
        onClick={copy}
        className="h-10 shrink-0 rounded-lg bg-neutral-800 px-3 text-sm font-semibold text-white dark:bg-neutral-200 dark:text-neutral-900"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
