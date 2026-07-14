/**
 * App branding — externalised so the source stays product-neutral while any deployment can set
 * its own brand via environment variables. `NEXT_PUBLIC_*` values are inlined at build time and
 * are safe to expose on the client.
 *
 * The wordmark renders `mark` (accent) immediately followed by `name` (plain). Defaults produce
 * "PulseOMS". To reproduce a two-word brand such as "Acme Sourcing", set:
 *   NEXT_PUBLIC_BRAND_MARK="Acme"
 *   NEXT_PUBLIC_BRAND_NAME=" Sourcing"   # note the leading space — mark and name are adjacent
 *   NEXT_PUBLIC_BRAND_BADGE="AC"          # short monogram for the square icon
 */
export const BRAND = {
  /** Accent/mono part of the wordmark and (by default) the PWA short name. */
  mark: process.env.NEXT_PUBLIC_BRAND_MARK ?? "Pulse",
  /** Plain part of the wordmark, rendered directly after `mark`. May start with a space. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "OMS",
  /** Short monogram rendered inside the square badge / generated PWA icons. */
  badge: process.env.NEXT_PUBLIC_BRAND_BADGE ?? "P",
  /** Optional marketing/website link shown on the login screen. Hidden when empty. */
  url: process.env.NEXT_PUBLIC_BRAND_URL ?? "",
} as const;

/** Full wordmark, e.g. "PulseOMS" (or "Acme Sourcing"). */
export const BRAND_FULL = `${BRAND.mark}${BRAND.name}`;
