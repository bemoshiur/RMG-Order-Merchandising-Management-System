"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, fd: FormData) => (await loginAction(fd)) ?? null,
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Email
        <input name="email" type="email" required autoComplete="username" className="input w-full" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="input w-full" />
      </label>
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-brand mt-1 w-full px-3 py-2.5 text-sm disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
