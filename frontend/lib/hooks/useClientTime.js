"use client";

/**
 * Client-side clock hook.
 *
 * Next.js (Cache Components) forbids reading the current time during
 * prerender, so this returns `null` for the first render and (re)reads
 * `new Date()` only after mount — in an effect callback and a timer tick,
 * which is the sanctioned pattern. One shared interval per component.
 *
 * @returns {Date | null}
 */
import { useEffect, useState } from "react";

export function useClientTime(intervalMs = 60_000) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const boot = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      clearTimeout(boot);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
