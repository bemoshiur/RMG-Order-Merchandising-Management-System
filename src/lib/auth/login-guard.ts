import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

// Brute-force protection: at most MAX_FAILURES failed logins per email within WINDOW_MS.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const AUTH = "Auth";

/** True when this email has hit the failed-login limit within the window (reuses the audit log
 *  as the counter — failed logins are recorded as audit rows). */
export async function isLoginRateLimited(email: string): Promise<boolean> {
  if (!email) return false;
  const since = new Date(Date.now() - WINDOW_MS);
  const fails = await prisma.auditLog.count({
    where: { entityType: AUTH, entityId: email, action: "login-failed", createdAt: { gte: since } },
  });
  return fails >= MAX_FAILURES;
}

export async function recordLoginFailure(email: string): Promise<void> {
  await recordAudit({ userId: null, entityType: AUTH, entityId: email, action: "login-failed" });
}

export async function recordLoginSuccess(userId: string): Promise<void> {
  await recordAudit({ userId, entityType: AUTH, entityId: userId, action: "login" });
}

export async function recordLogout(userId: string): Promise<void> {
  await recordAudit({ userId, entityType: AUTH, entityId: userId, action: "logout" });
}
