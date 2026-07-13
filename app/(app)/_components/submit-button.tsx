"use client";

import { useFormStatus } from "react-dom";

/** Submit button that shows a pending label while its form action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
