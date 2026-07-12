import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/money";
import type { PriceUnit } from "@/lib/database.types";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";

const UNIT_LABEL: Record<PriceUnit, string> = {
  flat: "flat",
  hour: "/ hr",
  yard: "/ yd",
  sqft: "/ sq ft",
};

export default async function PriceListPage() {
  await requireOwner();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("price_items")
    .select("*")
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  return (
    <>
      <PageHeader
        title="Price list"
        subtitle="Used to speed up quotes & invoices"
        actionHref="/price-list/new"
        actionLabel="New"
      />

      {!items || items.length === 0 ? (
        <EmptyState
          title="No price items yet"
          description="Add the services you offer (e.g. Weekly Mow, Mulch per yard) so quotes and invoices fill in fast."
        />
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/price-list/${item.id}/edit`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{item.name}</p>
                    {!item.active && (
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold tabular-nums">
                    {formatCents(item.default_rate_cents)}
                  </span>{" "}
                  <span className="text-sm text-neutral-500">
                    {UNIT_LABEL[item.unit]}
                  </span>
                </div>
                <span className="text-neutral-300">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
