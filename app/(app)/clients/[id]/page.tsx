import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PhoneIcon, MapPinIcon } from "../../_components/icons";
import { ComingSoon } from "../../_components/empty-state";
import { DeleteClientButton } from "./_components/delete-client-button";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}`;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const isOwner = profile.role === "owner";

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const navAddress = client.property_address || client.billing_address;

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/90 px-2 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <Link
          href="/clients"
          className="flex h-11 items-center rounded-lg px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ‹ Clients
        </Link>
        {isOwner && (
          <Link
            href={`/clients/${client.id}/edit`}
            className="flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950/30"
          >
            Edit
          </Link>
        )}
      </header>

      <div className="flex flex-col gap-6 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            {client.status === "inactive" && (
              <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800">
                Inactive
              </span>
            )}
          </div>
          {client.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {client.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            href={client.phone ? `tel:${client.phone}` : undefined}
            icon={<PhoneIcon className="h-5 w-5" />}
            label="Call"
          />
          <QuickAction
            href={navAddress ? mapsUrl(navAddress) : undefined}
            external
            icon={<MapPinIcon className="h-5 w-5" />}
            label="Navigate"
          />
        </div>

        {/* Contact details */}
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <DetailRow label="Phone">
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="text-green-700 dark:text-green-500">
                {client.phone}
              </a>
            ) : (
              <Muted />
            )}
          </DetailRow>
          <DetailRow label="Email">
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="break-all text-green-700 dark:text-green-500"
              >
                {client.email}
              </a>
            ) : (
              <Muted />
            )}
          </DetailRow>
          <DetailRow label="Property">
            {client.property_address ? (
              <a
                href={mapsUrl(client.property_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 dark:text-green-500"
              >
                {client.property_address}
              </a>
            ) : (
              <Muted />
            )}
          </DetailRow>
          <DetailRow label="Billing">
            {client.billing_address ? (
              <span>{client.billing_address}</span>
            ) : (
              <Muted />
            )}
          </DetailRow>
        </section>

        {client.notes && (
          <section>
            <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Notes
            </h2>
            <p className="whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              {client.notes}
            </p>
          </section>
        )}

        {/* Financial + history — owner only, wired up in later milestones. */}
        {isOwner && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="text-sm font-medium text-neutral-500">
                Running balance
              </span>
              <ComingSoon milestone="M5" />
            </div>
            <HistoryCard title="Quotes" milestone="M2" />
            <HistoryCard title="Jobs" milestone="M3" />
            <HistoryCard title="Invoices" milestone="M5" />
          </section>
        )}

        {isOwner && (
          <div className="pt-2">
            <DeleteClientButton id={client.id} />
          </div>
        )}
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  label,
  external,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  const base =
    "flex h-14 items-center justify-center gap-2 rounded-xl border text-base font-semibold";
  if (!href) {
    return (
      <div
        className={`${base} cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700`}
      >
        {icon}
        {label}
      </div>
    );
  }
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={`${base} border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300`}
    >
      {icon}
      {label}
    </a>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-4 py-3.5 last:border-0 dark:border-neutral-800">
      <span className="shrink-0 text-sm font-medium text-neutral-500">
        {label}
      </span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}

function Muted() {
  return <span className="text-neutral-300 dark:text-neutral-600">—</span>;
}

function HistoryCard({
  title,
  milestone,
}: {
  title: string;
  milestone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="text-sm font-medium text-neutral-500">{title}</span>
      <ComingSoon milestone={milestone} />
    </div>
  );
}
