"use client";

/**
 * Top bar — handoff "Top bar" (1440x72, bg-surface, bottom border).
 *
 *   left : 32px logo mark + app name (18/600)
 *   right: mission pill, Earth-delay pill, Danger/Medium "Emergency" button
 *
 * The Emergency button opens screen 10 from every screen.
 * Mission day is read from a client clock (Cache Components forbids reading
 * the time during prerender), so a same-width placeholder holds the layout
 * for the first frame.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  getEarthDelayLabel,
  getMissionDay,
  mission,
} from "@/lib/data/mission";

function LogoMark() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M3 12h3.6l1.7-4.2 2.6 8.4 1.8-5.1 1.1 2.4H21"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MissionPill({ icon, children, title, compact = false }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-2 rounded-pill border border-line font-medium text-secondary ${
        compact ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm"
      }`}
    >
      <Icon name={icon} size={compact ? 16 : 18} className="text-secondary" />
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
}

export default function TopBar({ onOpenMenu }) {
  const [now, setNow] = useState(null);

  // Tick once a minute so the mission day stays accurate across midnight.
  // The first value lands on a macrotask so server and client renders match.
  useEffect(() => {
    const boot = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearTimeout(boot);
      clearInterval(timer);
    };
  }, []);

  const missionDay = now ? getMissionDay(now) : null;
  const earthDelay = getEarthDelayLabel();

  const dayLabel =
    missionDay !== null ? (
      `Day ${missionDay} · ${mission.name}`
    ) : (
      // Invisible stand-in keeps the pill the same width until the clock lands.
      <span className="invisible">Day 120 · {mission.name}</span>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-[72px] lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-secondary transition-colors hover:bg-hover lg:hidden"
            aria-label="Open navigation menu"
          >
            <Icon name="menu" size={24} />
          </button>

          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="CrewPulse — Today"
          >
            <LogoMark />
            <span className="t-h3 truncate text-primary">CrewPulse</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <MissionPill icon="rocket_launch" title={`Mission day ${missionDay ?? 120}`}>
              {dayLabel}
            </MissionPill>
            <MissionPill
              icon="schedule"
              title="One-way Earth communication delay"
            >
              <span className="hidden lg:inline">Earth delay </span>
              {earthDelay}
            </MissionPill>
          </div>

          <ThemeToggle />

          <Link
            href="/emergency"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-emergency px-4 text-sm font-semibold text-white transition-colors hover:bg-emergency-hover"
            aria-label="Open emergency mode"
          >
            <Icon name="emergency" filled size={20} />
            <span className="hidden sm:inline">Emergency</span>
          </Link>
        </div>
      </div>

      {/* Mission context on phones — its own compact row so nothing is
          clipped or pushed out of the viewport. */}
      <div className="flex items-center gap-2 border-t border-line px-4 py-2 md:hidden">
        <MissionPill compact icon="rocket_launch">
          {dayLabel}
        </MissionPill>
        <MissionPill compact icon="schedule">
          {earthDelay}
        </MissionPill>
      </div>
    </header>
  );
}
