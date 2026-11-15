"use client";

/**
 * Application shell.
 *
 * Three chrome modes, matching the handoff:
 *   1. Sign in (screen 00) — no shell at all.
 *   2. Emergency (screens 10–13) — red Emergency bar instead of the top bar,
 *      no sidebar, content padding 40/64.
 *   3. Everything else — Top bar (72) + Sidebar (240) + content area
 *      (padding 40/48, max width 1104).
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSession } from "@/lib/data/session";

function EmergencyBar() {
  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-3 bg-emergency px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Icon name="emergency" filled size={24} className="text-white" />
        <span className="t-h3 truncate text-white">Emergency mode</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle variant="on-emergency" />
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-white px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
        >
          <Icon name="close" size={20} />
          <span className="hidden sm:inline">Close</span>
        </Link>
      </div>
    </header>
  );
}

export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, hydrated } = useSession();

  const isEmergency = pathname === "/emergency";
  const isHome = pathname === "/";
  const isSignIn = isHome && !isAuthenticated;

  // Screen 00 has no shell. The session is only known after mount, so hold a
  // neutral canvas for that single frame instead of flashing the wrong chrome.
  if (isHome && !hydrated) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (isSignIn) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  if (isEmergency) {
    return (
      <div className="min-h-screen bg-canvas">
        <EmergencyBar />
        <main
          id="main-content"
          className="px-4 pb-16 pt-10 sm:px-8 lg:px-16 lg:pb-0"
        >
          <div className="mx-auto w-full max-w-[1312px]">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex items-stretch">
        <Sidebar />

        <main
          id="main-content"
          className="min-w-0 flex-1 px-6 pb-28 pt-10 sm:px-8 lg:px-12 lg:pb-10"
        >
          {/* Gutters live on <main> so the inner box is the full 1104px the
              handoff measures (48px gutters inside a 1200px area). */}
          <div className="mx-auto w-full max-w-[1104px]">{children}</div>
        </main>
      </div>

      <MobileNavigation
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabsEnabled={!isSignIn}
      />
    </div>
  );
}
