export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200">
        {title}
      </h2>
      {description && (
        <p className="max-w-xs text-sm text-neutral-500">{description}</p>
      )}
      {children}
    </div>
  );
}

/** Small pill used for coming-soon placeholders on not-yet-built tabs. */
export function ComingSoon({ milestone }: { milestone: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      Coming in {milestone}
    </span>
  );
}
