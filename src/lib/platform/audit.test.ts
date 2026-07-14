import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "@/test/db";
import { recordAudit } from "@/lib/audit";
import { listPlatformAudit } from "./audit";

const operator = { id: "op-1", role: "SUPERADMIN" as const, companyId: null };

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await prisma.$disconnect(); });

async function seed() {
  const coA = await prisma.company.create({ data: { name: "Alpha Co", slug: "alpha" } });
  const coB = await prisma.company.create({ data: { name: "Beta Co", slug: "beta" } });
  const uA = await prisma.user.create({ data: { name: "Alice", email: "alice@a.com", passwordHash: "x", role: "ADMIN", companyId: coA.id } });
  const uB = await prisma.user.create({ data: { name: "Bob", email: "bob@b.com", passwordHash: "x", role: "MERCHANDISER", companyId: coB.id } });
  await recordAudit({ userId: uA.id, entityType: "PurchaseOrder", entityId: "po-a", action: "create" });
  await recordAudit({ userId: uB.id, entityType: "Invoice", entityId: "inv-b", action: "edit" });
  return { coA, coB, uA, uB };
}

describe("listPlatformAudit", () => {
  it("is gated to platform operators (SUPERADMIN with no tenant)", async () => {
    await expect(listPlatformAudit({ id: "x", role: "ADMIN", companyId: "co" }, {})).rejects.toThrow(/platform/i);
    // A SUPERADMIN that still belongs to a company is NOT a platform operator.
    await expect(listPlatformAudit({ id: "x", role: "SUPERADMIN", companyId: "co" }, {})).rejects.toThrow(/platform/i);
  });

  it("shows cross-company activity and resolves user + company names", async () => {
    const { coA } = await seed();
    const all = await listPlatformAudit(operator, {});
    expect(all.total).toBe(2);
    expect(all.rows.map((r) => r.company).sort()).toEqual(["Alpha Co", "Beta Co"]);
    expect(all.rows.find((r) => r.entityType === "PurchaseOrder")?.user).toBe("Alice");

    expect((await listPlatformAudit(operator, { companyId: coA.id })).total).toBe(1);

    const edits = await listPlatformAudit(operator, { action: "edit" });
    expect(edits.total).toBe(1);
    expect(edits.rows[0].entityType).toBe("Invoice");
  });
});
