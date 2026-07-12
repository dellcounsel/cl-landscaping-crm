import Link from "next/link";
import { PlusIcon } from "./icons";

/**
 * Sticky page header used at the top of each tab. Optionally renders a primary
 * action as a link (actionHref) with a "+" affordance.
 */
export function PageHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="truncate text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {actionHref && (
        <Link
          href={actionHref}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg bg-green-700 px-3.5 text-sm font-semibold text-white hover:bg-green-800 active:bg-green-900"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{actionLabel ?? "New"}</span>
        </Link>
      )}
    </header>
  );
}
