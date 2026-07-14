import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 * The app loads NO third-party browser resources (fonts/scripts/styles are all self-hosted;
 * the EPS payment gateway and abodesourcingbd.com are reached by top-level navigation, not
 * fetch/frame, so they need no directive). That lets us keep a tight policy:
 *  - `frame-ancestors 'none'` + `X-Frame-Options: DENY` — clickjacking protection.
 *  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` — injection hardening.
 *  - `'unsafe-inline'` is required for Next's inline bootstrap script + Tailwind's inline styles
 *    (no nonce pipeline). `'unsafe-eval'` is only added in dev, where the bundler needs it.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Enforce HTTPS for 2 years across all subdomains (only meaningful over HTTPS; harmless on localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Deny powerful browser features the app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
