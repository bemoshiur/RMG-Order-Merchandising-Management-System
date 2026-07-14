"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/** From/To day filter for the platform audit view — writes `from`/`to` search params. */
export function AuditDateRange() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
      <span>From</span>
      <input type="date" defaultValue={sp.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} className="select" aria-label="From date" />
      <span>To</span>
      <input type="date" defaultValue={sp.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} className="select" aria-label="To date" />
    </div>
  );
}
