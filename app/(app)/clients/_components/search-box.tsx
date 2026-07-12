"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "../../_components/icons";

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 250);
  }

  return (
    <div className="relative px-4 pt-3">
      <SearchIcon className="pointer-events-none absolute left-7 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        aria-label={placeholder}
        className="h-12 w-full rounded-lg border border-neutral-300 bg-white pl-11 pr-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 dark:border-neutral-700 dark:bg-neutral-900"
      />
    </div>
  );
}
