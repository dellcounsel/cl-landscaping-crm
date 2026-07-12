import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/page-header";
import { signOut } from "../actions";

export default async function MorePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = profile.role === "owner";

  return (
    <>
      <PageHeader title="More" />

      <div className="flex flex-col gap-6 p-4">
        {/* Account card */}
        <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 text-lg font-semibold text-white">
              {(profile.full_name || user?.email || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {profile.full_name || "Unnamed user"}
              </p>
              <p className="truncate text-sm text-neutral-500">
                {user?.email}
              </p>
            </div>
            <span className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium capitalize text-green-800 dark:bg-green-900/40 dark:text-green-300">
              {profile.role}
            </span>
          </div>
        </section>

        {isOwner && (
          <section>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Business
            </h2>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <MoreLink href="/price-list" label="Price list" />
              <MoreLink href="/settings" label="Settings" muted="M6" />
              <MoreLink href="/team" label="Team & invites" muted="M6" />
            </div>
          </section>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="h-12 w-full rounded-xl border border-neutral-300 bg-white text-base font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-red-950/30"
          >
            Sign out
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400">FieldBook · v0.1</p>
      </div>
    </>
  );
}

function MoreLink({
  href,
  label,
  muted,
}: {
  href: string;
  label: string;
  muted?: string;
}) {
  if (muted) {
    return (
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 last:border-0 dark:border-neutral-800">
        <span className="text-neutral-400">{label}</span>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
          {muted}
        </span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
    >
      <span className="font-medium">{label}</span>
      <span className="text-neutral-400">›</span>
    </Link>
  );
}
