import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import { listPlatformAudit, type PlatformAuditFilter } from "@/lib/platform/audit";
import { logoutAction } from "@/lib/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { ReportFilters } from "@/components/reports/report-filters";
import { Pagination } from "@/components/pagination";
import { formatDateTime } from "@/lib/format";
import { AuditDateRange } from "./audit-date-range";

const ACTION_CLS: Record<string, string> = {
  create: "bg-ok-soft text-ok",
  edit: "bg-warn-soft text-warn",
  delete: "bg-bad-soft text-bad",
  approve: "bg-accent-soft text-accent",
  login: "bg-paper text-ink-soft",
  logout: "bg-paper text-ink-soft",
  "login-failed": "bg-bad-soft text-bad",
};

type SP = { page?: string; company?: string; action?: string; entity?: string; q?: string; from?: string; to?: string };

export default async function PlatformAuditPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await getCurrentUser();
  if (!actor) redirect("/login");
  // Platform operator only (SUPERADMIN with no tenant). listPlatformAudit also asserts this.
  if (actor.role !== "SUPERADMIN" || actor.companyId != null) redirect("/dashboard");
  const sp = await searchParams;
  const filter: PlatformAuditFilter = { companyId: sp.company, action: sp.action, entityType: sp.entity, q: sp.q, from: sp.from, to: sp.to };
  const data = await listPlatformAudit(actor, filter, { page: Math.max(1, Number(sp.page) || 1) });

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-baseline gap-2">
            <BrandMark size="base" />
            <span className="ml-2 rounded-sm bg-accent-soft px-2 py-0.5 text-[0.625rem] font-semibold uppercase text-accent">Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-ink-soft hover:text-accent">← Console</Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-sm border border-line px-2.5 py-1 text-xs hover:border-accent hover:text-accent">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Super admin</p>
            <h1 className="text-2xl font-semibold tracking-tight">System audit trail</h1>
            <p className="mt-1 text-sm text-ink-soft">Every action across every company — who did what, when, and from where.</p>
          </div>
          <span className="text-xs text-ink-soft">{data.total} events</span>
        </div>

        <div className="space-y-3">
          <ReportFilters
            searchPlaceholder="Search entity type / id / IP…"
            resultLabel={`${data.rows.length} on this page · ${data.total} total`}
            selects={[
              { param: "company", allLabel: "All companies", options: data.companies },
              { param: "action", allLabel: "All actions", options: ["create", "edit", "delete", "approve", "login", "logout", "login-failed"].map((a) => ({ value: a, label: a })) },
              { param: "entity", allLabel: "All types", options: data.entityTypes.map((e) => ({ value: e, label: e })) },
            ]}
          />
          <AuditDateRange />

          <div className="overflow-x-auto rounded-lg border border-line bg-surface elevate">
            <table className="list-table w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-3 py-2.5 font-semibold">When</th>
                  <th className="px-3 py-2.5 font-semibold">Company</th>
                  <th className="px-3 py-2.5 font-semibold">User</th>
                  <th className="px-3 py-2.5 font-semibold">Action</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Details</th>
                  <th className="px-3 py-2.5 font-semibold">IP</th>
                  <th className="px-3 py-2.5 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-ink-soft">No activity matches.</td></tr>}
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-3 py-2 tnum text-xs text-ink-soft">{formatDateTime(r.createdAt)}</td>
                    <td className="px-3 py-2 text-xs">{r.company}</td>
                    <td className="px-3 py-2 text-xs font-medium">{r.user}</td>
                    <td className="px-3 py-2"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase ${ACTION_CLS[r.action] ?? "bg-paper text-ink-soft"}`}>{r.action}</span></td>
                    <td className="px-3 py-2 text-xs">{r.entityType}</td>
                    <td className="px-3 py-2 max-w-[26rem] truncate text-xs text-ink-soft" title={r.detail}>{r.detail || "—"}</td>
                    <td className="px-3 py-2 tnum text-xs text-ink-soft">{r.ip ?? "—"}</td>
                    <td className="px-3 py-2 max-w-[16rem] truncate text-xs text-ink-soft" title={r.userAgent ?? ""}>{r.userAgent ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} params={sp} />
        </div>
      </main>
    </div>
  );
}
