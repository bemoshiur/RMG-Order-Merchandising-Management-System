import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";
import { isLoginRateLimited, recordLoginFailure, recordLoginSuccess, recordLogout } from "./login-guard";

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("login rate limiting", () => {
  it("locks an email after 5 failed attempts, scoped per email", async () => {
    for (let i = 0; i < 4; i++) await recordLoginFailure("a@b.com");
    expect(await isLoginRateLimited("a@b.com")).toBe(false);
    await recordLoginFailure("a@b.com");
    expect(await isLoginRateLimited("a@b.com")).toBe(true);
    expect(await isLoginRateLimited("other@b.com")).toBe(false); // per-email
    expect(await isLoginRateLimited("")).toBe(false);
  });

  it("ignores failures outside the time window", async () => {
    for (let i = 0; i < 6; i++) await recordLoginFailure("stale@b.com");
    // Backdate all failures beyond the window.
    await prisma.auditLog.updateMany({ where: { entityId: "stale@b.com" }, data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } });
    expect(await isLoginRateLimited("stale@b.com")).toBe(false);
  });
});

describe("auth event audit trail", () => {
  it("records login / logout with the user attached", async () => {
    await recordLoginSuccess("user-1");
    await recordLogout("user-1");
    const rows = await prisma.auditLog.findMany({ where: { entityType: "Auth", userId: "user-1" }, orderBy: { createdAt: "asc" } });
    expect(rows.map((r) => r.action)).toEqual(["login", "logout"]);
  });
});
