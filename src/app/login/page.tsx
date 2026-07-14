import { BrandMark, BrandBadge } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  return (
    <main className="auth-mesh flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-sm rounded-2xl p-7">
        <div className="flex flex-col items-center text-center">
          <BrandBadge className="h-12 w-12 text-sm" />
          <div className="mt-3"><BrandMark size="lg" tagline="Order & Merchandising" /></div>
        </div>
        {welcome && (
          <p className="mt-5 rounded-sm bg-ok-soft px-3 py-2 text-sm text-ok">
            Company created — sign in with your new admin account.
          </p>
        )}
        <h1 className="mt-6 mb-4 text-lg font-semibold tracking-tight">Sign in</h1>
        <LoginForm />
        {BRAND.url && (
          <p className="mt-6 border-t border-line pt-4 text-center text-sm text-ink-soft">
            <a href={BRAND.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
              Visit {BRAND.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} →
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
