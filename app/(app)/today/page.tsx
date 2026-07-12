import { PageHeader } from "../_components/page-header";
import { EmptyState, ComingSoon } from "../_components/empty-state";
import { formatDateLong, todayISO } from "@/lib/dates";

export default function TodayPage() {
  return (
    <>
      <PageHeader title="Today" subtitle={formatDateLong(todayISO())} />
      <EmptyState
        title="No jobs yet"
        description="Your day's jobs will show up here once scheduling is live."
      >
        <ComingSoon milestone="M3" />
      </EmptyState>
    </>
  );
}
