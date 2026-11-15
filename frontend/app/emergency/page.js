"use client";

/**
 * ROUTE `/emergency` — SCREENS 10–13 (Emergency mode).
 *
 * One tap from the Emergency button in the top bar on every screen. The shell
 * (red Emergency bar, no sidebar, content padding 40/64, full-width step
 * indicator) is provided by `AppShell`; the four steps live in `EmergencyFlow`.
 *
 * Nothing here contacts an external service — alerts are local records only.
 */

import EmergencyFlow from "@/components/emergency/EmergencyFlow";

export default function EmergencyPage() {
  return <EmergencyFlow />;
}
