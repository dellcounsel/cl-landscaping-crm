import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/database.types";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { SearchBox } from "./_components/search-box";

// Strip characters that would break Supabase's .or() filter grammar.
function sanitizeQuery(q: string): string {
  return q.replace(/[,()%]/g, " ").trim();
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, phone, property_address, tags, status")
    .order("name", { ascending: true })
    .limit(200);

  const term = q ? sanitizeQuery(q) : "";
  if (term) {
    const like = `%${term}%`;
    query = query.or(
      `name.ilike.${like},property_address.ilike.${like},billing_address.ilike.${like},phone.ilike.${like}`,
    );
  }

  const { data: clients } = await query;

  return (
    <>
      <PageHeader
        title="Clients"
        actionHref={profile.role === "owner" ? "/clients/new" : undefined}
        actionLabel="New"
      />
      <SearchBox placeholder="Search name, address, phone" />

      {!clients || clients.length === 0 ? (
        <EmptyState
          title={term ? "No matches" : "No clients yet"}
          description={
            term
              ? "Try a different search."
              : profile.role === "owner"
                ? "Add your first client to get started."
                : "Clients added by the owner will show up here."
          }
        />
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {clients.map((c) => (
            <ClientRow key={c.id} client={c} />
          ))}
        </ul>
      )}
    </>
  );
}

function ClientRow({
  client,
}: {
  client: Pick<
    Client,
    "id" | "name" | "phone" | "property_address" | "tags" | "status"
  >;
}) {
  return (
    <li>
      <Link
        href={`/clients/${client.id}`}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-800/50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{client.name}</p>
            {client.status === "inactive" && (
              <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800">
                Inactive
              </span>
            )}
          </div>
          {client.property_address && (
            <p className="truncate text-sm text-neutral-500">
              {client.property_address}
            </p>
          )}
          {client.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {client.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-neutral-300">›</span>
      </Link>
    </li>
  );
}
