"use server";

import { AuthError } from "next-auth";
import { signIn, signOut, auth } from "@/auth";
import { isLoginRateLimited, recordLogout } from "@/lib/auth/login-guard";

export async function loginAction(formData: FormData): Promise<{ error?: string } | void> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  // Friendly early-out when already locked out. The authoritative rate-limit + failed-attempt
  // recording lives in the credentials `authorize` (src/auth.ts) so direct POSTs are covered too.
  if (await isLoginRateLimited(email)) {
    return { error: "Too many failed attempts. Please wait a few minutes and try again." };
  }
  try {
    // On success signIn throws a redirect (NEXT_REDIRECT) which propagates and navigates; the
    // successful-login audit row is written by the events.signIn callback in src/auth.ts, and a
    // failed attempt is recorded inside `authorize`.
    await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw e; // NEXT_REDIRECT on success
  }
}

export async function logoutAction() {
  const session = await auth();
  const uid = session?.user?.id;
  if (uid) await recordLogout(uid);
  await signOut({ redirectTo: "/login" });
}
