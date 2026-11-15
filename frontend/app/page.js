"use client";

/**
 * ROUTE `/`
 *
 * Screen 00 (Sign in) when no crew member is signed in, screen 01 (Today)
 * otherwise. The shell itself is decided in `AppShell` — sign-in has no
 * top bar / sidebar.
 *
 * The shell holds a neutral canvas until the session hydrates, so this
 * segment intentionally renders no markup during prerender — it is opted
 * out of instant-navigation validation.
 */

import TodayDashboard from "@/components/dashboard/TodayDashboard";

export default function HomePage() {
  return <TodayDashboard />;
}
