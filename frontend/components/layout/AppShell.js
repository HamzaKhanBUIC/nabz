"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PageTransition from "@/components/ui/PageTransition";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { formatElapsed } from "@/lib/utils/format";

function EmergencyBar() {
  const [enteredAt] = useState(() =>
    typeof window !== "undefined" ? Date.now() : null,
  );
  const now = useClientTime(1000);
  const elapsedMs = now && enteredAt ? Math.max(0, now.getTime() - enteredAt) : 0;

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
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-white/15 px-3.5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-white/25 active:scale-[0.98]"
        >
          <Icon name="close" size={18} />
          <span>Exit</span>
        </Link>
      </div>
    </header>
  );
}

export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isEmergency = pathname === "/emergency";

  if (isEmergency) {
    return (
      <div className="min-h-dvh overflow-x-clip bg-canvas text-primary">
        <EmergencyBar />
        <main className="mx-auto w-full max-w-[1376px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-primary">
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-5 sm:px-8 sm:pt-6 lg:px-10 lg:pb-12">
          <div className="mx-auto w-full max-w-[1120px]">
            <PageTransition key={pathname}>{children}</PageTransition>
          </div>
        </main>
      </div>

      <MobileNavigation open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
