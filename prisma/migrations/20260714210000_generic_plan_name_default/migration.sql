-- Genericize the default subscription plan name (remove client-derived product name).
ALTER TABLE "Subscription" ALTER COLUMN "planName" SET DEFAULT 'OMS — Managed SaaS';
