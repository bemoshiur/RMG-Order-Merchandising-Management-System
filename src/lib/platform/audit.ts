import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { type SessionUser } from "@/lib/auth/guard";
import { assertPlatformOperator } from "./guard";

export type PlatformAuditRow = {
  id: string;
  createdAt: Date;
  user: string;
  company: string;
  action: string;
  entityType: string;
  entityId: string;
  ip: string | null;
  userAgent: string | null;
  detail: string;
};

export type PlatformAuditFilter = {
  companyId?: string;
  action?: string;
  entityType?: string;
  q?: string;
  from?: string; // yyyy-mm-dd (inclusive)
  to?: string; // yyyy-mm-dd (inclusive)
};

/** Compact one-line summary of the changed fields (prefers `after`, falls back to `before`). */
function summarise(before: Prisma.JsonValue, after: Prisma.JsonValue): string {
  const obj = (after && typeof after === "object" && !Array.isArray(after) ? after : null)
    ?? (before && typeof before === "object" && !Array.isArray(before) ? before : null);
  if (!obj) return "";
  return Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${v && typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .slice(0, 8)
    .join(" · ");
}

/**
 * Platform-wide ("mega") audit feed across EVERY company — the super-admin's window into the whole
 * system. Gated by assertPlatformOperator (SUPERADMIN with no tenant). AuditLog carries no
 * companyId, so company/user attribution is resolved by joining userId → User → Company. System
 * rows (no userId) show "(system)"; auth events surface the attempted email.
 */
export async function listPlatformAudit(
  actor: SessionUser,
  filter: PlatformAuditFilter,
  opts: { page?: number; pageSize?: number } = {},
) {
  assertPlatformOperator(actor);

  const companies = await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  // Company filter → the set of that company's user ids (AuditLog has no companyId column).
  let userScope: Prisma.StringFilter | undefined;
  if (filter.companyId) {
    const us = await prisma.user.findMany({ where: { companyId: filter.companyId }, select: { id: true } });
    userScope = { in: us.map((u) => u.id) };
  }

  const createdAt: Prisma.DateTimeFilter = {};
  if (filter.from) createdAt.gte = new Date(`${filter.from}T00:00:00.000Z`);
  if (filter.to) createdAt.lt = new Date(new Date(`${filter.to}T00:00:00.000Z`).getTime() + 86_400_000);

  const q = filter.q?.trim();
  const where: Prisma.AuditLogWhereInput = {
    ...(userScope ? { userId: userScope } : {}),
    ...(filter.action ? { action: filter.action } : {}),
    ...(filter.entityType ? { entityType: filter.entityType } : {}),
    ...(filter.from || filter.to ? { createdAt } : {}),
    ...(q ? { OR: [{ entityType: { contains: q, mode: "insensitive" } }, { entityId: { contains: q, mode: "insensitive" } }, { ip: { contains: q } }] } : {}),
  };

  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));
  const total = await prisma.auditLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, opts.page ?? 1), totalPages);
  const [rows, entityTypeRows] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.auditLog.findMany({ select: { entityType: true }, distinct: ["entityType"], orderBy: { entityType: "asc" } }),
  ]);

  const uids = [...new Set(rows.map((r) => r.userId).filter(Boolean) as string[])];
  const users = uids.length
    ? await prisma.user.findMany({ where: { id: { in: uids } }, select: { id: true, name: true, email: true, companyId: true } })
    : [];
  const umap = new Map(users.map((u) => [u.id, u]));

  return {
    rows: rows.map((r): PlatformAuditRow => {
      const u = r.userId ? umap.get(r.userId) : undefined;
      return {
        id: r.id,
        createdAt: r.createdAt,
        user: u ? (u.name || u.email) : (r.entityType === "Auth" ? r.entityId : "(system)"),
        company: u?.companyId ? (companyName.get(u.companyId) ?? "—") : "—",
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        ip: r.ip,
        userAgent: r.userAgent,
        detail: summarise(r.before, r.after),
      };
    }),
    total,
    page,
    pageSize,
    totalPages,
    companies: companies.map((c) => ({ value: c.id, label: c.name })),
    entityTypes: entityTypeRows.map((e) => e.entityType),
  };
}
