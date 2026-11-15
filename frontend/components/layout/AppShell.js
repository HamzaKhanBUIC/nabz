"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import AuthGuard from "@/components/layout/AuthGuard";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PageTransition from "@/components/ui/PageTransition";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { formatElapsed } from "@/lib/utils/format";
import { useSession } from "@/lib/data/session";
import { APP_NAME } from "@/lib/data/nav";

function EmergencyBar() {
  const [enteredAt] = useState(() =>
    typeof window !== "undefined" ? Date.now() : null,
  );
  const now = useClientTime(1000);
  const elapsedMs = now && enteredAt ? Math.max(0, now.getTime() - enteredAt) : 0;
  const { isAuthenticated } = useSession();

  return (
    <header className="sticky top-0 z-40 flex min-h-[68px] items-center justify-between gap-3 bg-emergency px-4 py-2 shadow-md sm:min-h-[72px] sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon name="emergency" filled size={24} className="shrink-0 text-white" />
        <div className="min-w-0">
          <p className="t-h3 truncate text-white">Emergency mode</p>
          <p className="font-mono text-xs text-white/90">
            Offline guides · {formatElapsed(elapsedMs)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle variant="on-emergency" />
        <Link
          href={isAuthenticated ? "/" : "/sign-in"}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-white/15 px-3.5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-white/25 active:scale-[0.98]"
        >
          <Icon name="close" size={18} />
          <span>Exit</span>
        </Link>
      </div>
    </header>
  );
}

function SignInBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[64px] max-w-[1120px] items-center justify-between gap-2 px-4 py-2 sm:min-h-[72px] sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/sign-in" className="flex min-w-0 items-center gap-2.5 group">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-on-status shadow-xs transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:scale-[1.03]">
            <Icon name="pulse_alert" size={20} />
          </span>
          <span className="t-h3 truncate text-primary">{APP_NAME}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/real-data"
            className="hidden sm:inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 text-sm font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
          >
            <Icon name="biotech" size={18} />
            <span>Real astronaut data</span>
          </Link>

          <ThemeToggle />

          <Link
            href="/emergency"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emergency px-3.5 sm:px-4 text-sm font-semibold text-white shadow-sm shadow-emergency/25 transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:bg-emergency-hover active:scale-[0.98]"
            aria-label="Open emergency mode"
          >
            <Icon name="emergency" filled size={20} />
            <span>Emergency</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useSession();
  const isEmergency = pathname === "/emergency";
  const isSignIn = pathname === "/sign-in";

  if (isEmergency) {
    return (
      <div className="min-h-dvh overflow-x-clip bg-canvas text-primary">
        <EmergencyBar />
        <main className="mx-auto w-full max-w-[1376px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <AuthGuard>
            <PageTransition key={pathname}>{children}</PageTransition>
          </AuthGuard>
        </main>
      </div>
    );
  }

  if (isSignIn) {
    return (
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-primary">
        <SignInBar />
        <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center px-4 py-6 sm:px-8 sm:py-10">
          <AuthGuard>
            <PageTransition key={pathname}>{children}</PageTransition>
          </AuthGuard>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-primary">
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex flex-1">
        <Sidebar />
        <main
          className={`min-w-0 flex-1 px-4 pt-5 sm:px-8 sm:pt-6 lg:px-10 lg:pb-12 ${
            isAuthenticated
              ? "pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
              : "pb-10"
          }`}
        >
          <div className="mx-auto w-full max-w-[1120px]">
            <AuthGuard>
              <PageTransition key={pathname}>{children}</PageTransition>
            </AuthGuard>
          </div>
        </main>
      </div>

      <MobileNavigation
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabsEnabled={isAuthenticated}
      />
    </div>
  );
}
