import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_TEMPLATES } from "../src/lib/tna/template-data";

const prisma = new PrismaClient();

async function main() {
  // Generic defaults; override via env so real identities never live in the repo.
  const companyName = process.env.SEED_COMPANY_NAME ?? "Demo Sourcing";
  const companySlug = process.env.SEED_COMPANY_SLUG ?? "demo";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const superEmail = (process.env.SEED_SUPERADMIN_EMAIL ?? "super@example.com").toLowerCase();

  // First tenant company.
  let company = await prisma.company.findFirst({ where: { slug: companySlug } });
  if (!company) company = await prisma.company.create({ data: { name: companyName, slug: companySlug } });
  const companyId = company.id;

  // Default package + link.
  let pkg = await prisma.package.findFirst({ where: { name: "Standard" } });
  if (!pkg) pkg = await prisma.package.create({ data: { name: "Standard", priceBdt: 3333, periodDays: 30 } });
  if (!company.packageId) await prisma.company.update({ where: { id: companyId }, data: { packageId: pkg.id } });

  // Company admin + platform super admin.
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Admin", email: adminEmail, role: "ADMIN", passwordHash: await bcrypt.hash("ChangeMe123!", 10), companyId },
  });
  await prisma.user.upsert({
    where: { email: superEmail },
    update: {},
    create: { name: "Platform Super Admin", email: superEmail, role: "SUPERADMIN", passwordHash: await bcrypt.hash("ChangeMe-Super-123!", 10), companyId: null },
  });
  console.log(`Seeded company ${companyName} + ${adminEmail} + ${superEmail}`);

  // Default size scales (per company).
  const scales: Record<string, string[]> = {
    "Adult XS-6XL": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"],
    "Adult XS-2XL": ["XS", "S", "M", "L", "XL", "2XL"],
    "Kids": ["3-4", "5-6", "7-8", "9-11", "12-13"],
  };
  for (const [name, sizes] of Object.entries(scales)) {
    const exists = await prisma.sizeScale.findFirst({ where: { name, companyId } });
    if (!exists) {
      await prisma.sizeScale.create({
        data: { name, companyId, sizes: { create: sizes.map((label, position) => ({ label, position, companyId })) } },
      });
    }
  }

  // Default colours (per company).
  for (const name of ["Black", "White", "Navy", "Royal", "Red", "Bottle Green"]) {
    const exists = await prisma.colour.findFirst({ where: { name, companyId } });
    if (!exists) await prisma.colour.create({ data: { name, companyId } });
  }
  console.log("Seeded default size scales + colours");

  // Default T&A milestone templates (per company).
  const tCount = await prisma.taMilestoneTemplate.count({ where: { companyId } });
  if (tCount === 0) {
    await prisma.taMilestoneTemplate.createMany({ data: DEFAULT_TEMPLATES.map((t) => ({ ...t, companyId })) });
  }
  console.log("Seeded T&A milestone templates");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
