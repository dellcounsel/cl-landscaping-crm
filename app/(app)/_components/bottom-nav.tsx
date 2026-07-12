"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/database.types";
import {
  TodayIcon,
  ScheduleIcon,
  ClientsIcon,
  InvoicesIcon,
  MoreIcon,
} from "./icons";

type Tab = {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  ownerOnly?: boolean;
};

const TABS: Tab[] = [
  { href: "/today", label: "Today", Icon: TodayIcon },
  { href: "/schedule", label: "Schedule", Icon: ScheduleIcon },
  { href: "/clients", label: "Clients", Icon: ClientsIcon },
  { href: "/invoices", label: "Invoices", Icon: InvoicesIcon, ownerOnly: true },
  { href: "/more", label: "More", Icon: MoreIcon },
];

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => !t.ownerOnly || role === "owner");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "text-green-700 dark:text-green-500"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
