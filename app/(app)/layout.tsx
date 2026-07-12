import { requireProfile } from "@/lib/auth";
import { BottomNav } from "./_components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      {/* pb reserves room for the fixed bottom nav (h-14 + safe area). */}
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav role={profile.role} />
    </div>
  );
}
