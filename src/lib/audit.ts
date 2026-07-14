import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "login"
  | "logout"
  | "login-failed";

export type AuditInput = {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

/** Best-effort client IP + user-agent from the current request (null outside a request scope,
 *  e.g. cron/backfill). Dynamic import keeps next/headers out of any edge bundle. */
async function requestInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const ip = (fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip")) || null;
    return { ip, userAgent: h.get("user-agent") || null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/**
 * Append an immutable audit-trail row. Captures who (userId), what (entityType/entityId/action),
 * the before/after payload, and — best-effort — the client IP + user-agent, so an admin can see
 * exactly what each user did and from where. Accepts a transaction client so it can be atomic with
 * the change it records.
 */
export async function recordAudit(
  input: AuditInput,
  client: Prisma.TransactionClient = prisma,
): Promise<void> {
  const { ip, userAgent } = await requestInfo();
  await client.auditLog.create({
    data: {
      userId: input.userId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      before: input.before,
      after: input.after,
      ip,
      userAgent,
    },
  });
}
