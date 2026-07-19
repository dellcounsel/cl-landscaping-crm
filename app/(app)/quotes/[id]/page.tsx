import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";
import { formatDateLong, formatDateTime } from "@/lib/dates";
import { quoteStatusClasses, quoteStatusLabel } from "@/lib/quotes";
import { QuoteSummary } from "@/components/quote-summary";
import { SubmitButton } from "../../_components/submit-button";
import { CopyLink } from "./_components/copy-link";
import {
  sendQuoteAction,
  setQuoteStatusAction,
  deleteQuoteAction,
} from "../actions";
import { convertQuoteToJob } from "../../jobs/actions";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  await requireOwner();

  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, clients(id, name, email)")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const client = quote.clients as {
    id: string;
    name: string;
    email: string | null;
  } | null;
  const base = await getBaseUrl();
  const publicUrl = `${base}/q/${quote.public_token}`;
  const isDraft = quote.status === "draft";
  const isSent = quote.status === "sent";

  const send = sendQuoteAction.bind(null, id);
  const approve = setQuoteStatusAction.bind(null, id, "approved");
  const decline = setQuoteStatusAction.bind(null, id, "declined");
  const del = deleteQuoteAction.bind(null, id, client?.id ?? "");

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50/90 px-2 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <Link
          href={client ? `/clients/${client.id}` : "/clients"}
          className="flex h-11 items-center rounded-lg px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ‹ {client?.name ?? "Client"}
        </Link>
        {isDraft && (
          <Link
            href={`/quotes/${id}/edit`}
            className="flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950/30"
          >
            Edit
          </Link>
        )}
      </header>

      <div className="flex flex-col gap-5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quote</h1>
            <p className="text-sm text-neutral-500">
              Created {formatDateLong(quote.created_at.slice(0, 10))}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${quoteStatusClasses(quote.status)}`}
          >
            {quoteStatusLabel(quote.status)}
          </span>
        </div>

        {sent === "email" && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-950/30 dark:text-green-300">
            Quote emailed to {client?.email}. Share the link below if needed.
          </p>
        )}
        {sent === "link" && (
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
            Quote marked as sent. No email went out{" "}
            {client?.email ? "(email isn't configured yet)" : "(no address on file)"} —
            share the public link below with your client.
          </p>
        )}

        <QuoteSummary
          lineItems={quote.line_items}
          subtotalCents={quote.subtotal_cents}
          taxRate={quote.tax_rate}
          taxCents={quote.tax_cents}
          totalCents={quote.total_cents}
        />

        {quote.notes && (
          <p className="whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            {quote.notes}
          </p>
        )}

        {quote.approved_at && (
          <p className="text-sm text-green-700 dark:text-green-400">
            Approved by client on {formatDateTime(quote.approved_at)}
          </p>
        )}

        {quote.status === "approved" && (
          <form action={convertQuoteToJob.bind(null, id)}>
            <SubmitButton
              pendingLabel="Creating job…"
              className="h-12 w-full rounded-lg bg-green-700 text-base font-semibold text-white hover:bg-green-800 active:bg-green-900 disabled:opacity-60"
            >
              Convert to job
            </SubmitButton>
          </form>
        )}
        {quote.declined_at && (
          <p className="text-sm text-red-600">
            Declined by client on {formatDateTime(quote.declined_at)}
          </p>
        )}

        {/* Send / public link */}
        {isDraft ? (
          <form action={send}>
            <SubmitButton
              pendingLabel="Sending…"
              className="h-12 w-full rounded-lg bg-green-700 text-base font-semibold text-white hover:bg-green-800 active:bg-green-900 disabled:opacity-60"
            >
              {client?.email ? "Send to client" : "Mark sent & get link"}
            </SubmitButton>
          </form>
        ) : (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Public approval link
            </h2>
            <CopyLink url={publicUrl} />
            <div className="flex gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center rounded-lg border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
              >
                Preview
              </a>
              <form action={send} className="flex-1">
                <SubmitButton
                  pendingLabel="Resending…"
                  className="h-10 w-full rounded-lg border border-neutral-300 text-sm font-semibold disabled:opacity-60 dark:border-neutral-700"
                >
                  Resend email
                </SubmitButton>
              </form>
            </div>
          </section>
        )}

        {/* Manual status controls (owner override) */}
        {(isSent || quote.status === "expired") && (
          <div className="flex gap-2">
            <form action={approve} className="flex-1">
              <SubmitButton className="h-10 w-full rounded-lg bg-green-100 text-sm font-semibold text-green-800 disabled:opacity-60 dark:bg-green-900/40 dark:text-green-300">
                Mark approved
              </SubmitButton>
            </form>
            <form action={decline} className="flex-1">
              <SubmitButton className="h-10 w-full rounded-lg bg-red-100 text-sm font-semibold text-red-700 disabled:opacity-60 dark:bg-red-900/40 dark:text-red-300">
                Mark declined
              </SubmitButton>
            </form>
          </div>
        )}

        {isDraft && (
          <form action={del}>
            <SubmitButton
              pendingLabel="Deleting…"
              className="h-11 w-full rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50"
            >
              Delete draft
            </SubmitButton>
          </form>
        )}
      </div>
    </>
  );
}
