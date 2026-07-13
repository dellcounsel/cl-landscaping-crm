import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { businessName } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { formatDateLong, formatDateTime, todayISO } from "@/lib/dates";
import { QuoteSummary } from "@/components/quote-summary";
import { RespondButtons } from "./_components/respond-buttons";

export const metadata: Metadata = { title: "Your quote" };

// Always render fresh so status changes show immediately after responding.
export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Service-role lookup by token; hand-select only safe fields (no internal
  // ids beyond what's needed, no other client data).
  const supabase = createServiceClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "status, line_items, subtotal_cents, tax_rate, tax_cents, total_cents, notes, valid_until, approved_at, declined_at, clients(name)",
    )
    .eq("public_token", token)
    .single();

  // Drafts have a token but were never sent — treat as not available.
  if (!quote || quote.status === "draft") notFound();

  const client = quote.clients as { name: string } | null;
  const business = businessName();
  const expired =
    quote.status === "expired" ||
    (quote.status === "sent" &&
      !!quote.valid_until &&
      quote.valid_until < todayISO());
  const canRespond = quote.status === "sent" && !expired;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-500">
          {business}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Quote</h1>
        {client && (
          <p className="text-neutral-500">Prepared for {client.name}</p>
        )}
        {quote.valid_until && (
          <p className="mt-1 text-sm text-neutral-500">
            Valid until {formatDateLong(quote.valid_until)}
          </p>
        )}
      </div>

      <QuoteSummary
        lineItems={quote.line_items}
        subtotalCents={quote.subtotal_cents}
        taxRate={quote.tax_rate}
        taxCents={quote.tax_cents}
        totalCents={quote.total_cents}
      />

      {quote.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          {quote.notes}
        </p>
      )}

      <div className="mt-8">
        {quote.status === "approved" ? (
          <StatusBanner tone="good">
            You approved this quote{" "}
            {quote.approved_at && `on ${formatDateTime(quote.approved_at)}`}.
            Thanks — {business} will be in touch.
          </StatusBanner>
        ) : quote.status === "declined" ? (
          <StatusBanner tone="bad">
            You declined this quote{" "}
            {quote.declined_at && `on ${formatDateTime(quote.declined_at)}`}. If
            that was a mistake, contact {business}.
          </StatusBanner>
        ) : expired ? (
          <StatusBanner tone="warn">
            This quote has expired. Please contact {business} for an updated
            quote.
          </StatusBanner>
        ) : canRespond ? (
          <>
            <p className="mb-4 text-center text-sm text-neutral-500">
              Total due:{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {formatCents(quote.total_cents)}
              </span>
            </p>
            <RespondButtons token={token} />
          </>
        ) : null}
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-neutral-400">
        Powered by FieldBook
      </p>
    </main>
  );
}

function StatusBanner({
  tone,
  children,
}: {
  tone: "good" | "bad" | "warn";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
      : tone === "bad"
        ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
        : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
  return (
    <div className={`rounded-xl px-4 py-4 text-center text-sm font-medium ${toneClass}`}>
      {children}
    </div>
  );
}
