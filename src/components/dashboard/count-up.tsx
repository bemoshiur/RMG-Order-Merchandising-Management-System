"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatQty } from "@/lib/format";

type Fmt = "money" | "qty" | "pct";

function render(n: number, fmt: Fmt): string {
  if (fmt === "money") return formatMoney(Math.round(n));
  if (fmt === "pct") return `${Math.round(n)}%`;
  return formatQty(Math.round(n));
}

/** Animated count-up that eases 0 → value once on mount (respects reduced-motion). */
export function CountUp({ value, format = "qty", className }: { value: number; format?: Fmt; className?: string }) {
  const [n, setN] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Reduced motion: leave n at its initial value (useState(value)) — no animation, no setState.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    const dur = 900;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    // Deliberate one-time reset so the value animates from 0 (initial state is `value` to avoid a
    // no-JS/SSR flash). This is the intended single render, not an accidental cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setN(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{render(n, format)}</span>;
}
