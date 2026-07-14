import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        // Enforce brute-force protection HERE (not just in loginAction): the
        // /api/auth/callback/credentials endpoint can be POSTed directly, bypassing the
        // server action. This is the single choke point every login path passes through, so
        // failed attempts are recorded here exactly once (loginAction no longer double-records).
        const { isLoginRateLimited, recordLoginFailure } = await import("@/lib/auth/login-guard");
        if (await isLoginRateLimited(email)) return null; // locked out — do NOT record (would extend lockout forever)
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) {
          await recordLoginFailure(email);
          return null;
        }
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          await recordLoginFailure(email);
          return null;
        }
        return { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
        token.companyId = (user as { companyId: string | null }).companyId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.companyId = (token.companyId as string | null) ?? null;
      }
      return session;
    },
  },
  events: {
    // Audit successful sign-ins. Dynamic import keeps @/lib/audit (and next/headers) out of the
    // edge/middleware bundle; this callback only runs in the Node auth route handler.
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        const { recordAudit } = await import("@/lib/audit");
        await recordAudit({ userId: user.id, entityType: "Auth", entityId: user.id, action: "login" });
      } catch {
        /* never block sign-in on an audit write */
      }
    },
  },
});
