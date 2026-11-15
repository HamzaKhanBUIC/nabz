"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useStore } from "@/lib/data/store";
import { getEarthDelayLabel } from "@/lib/data/mission";
import { APP_NAME } from "@/lib/data/nav";

function MissionPill({ icon, children, title, tone = "neutral", compact = false }) {
  const palette =
    tone === "offline"
      ? "border-attention/40 bg-attention/10 text-attention"
      : "border-line bg-surface text-secondary";
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-pill border font-medium whitespace-nowrap ${palette} ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
      }`}
    >
      <Icon name={icon} size={compact ? 14 : 16} />
      <span>{children}</span>
    </span>
  );
}

export default function TopBar({ onOpenMenu }) {
  const { mission, backendOnline } = useStore();
  const missionDay = mission?.missionDay ?? 1;
  const missionName = mission?.name || "Mars Transit Sim";
  const delayLabel = getEarthDelayLabel(mission);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-surface text-secondary transition-colors hover:bg-hover hover:text-primary md:hidden"
          >
            <Icon name="menu" size={22} />
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-on-status">
              <Icon name="pulse_alert" size={20} />
            </span>
            <span className="t-h3 truncate text-primary">{APP_NAME}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <MissionPill
              icon="rocket_launch"
              title={`Mission day ${missionDay} — ${missionName}`}
            >
              {`Day ${missionDay} · ${missionName}`}
            </MissionPill>
            <MissionPill
              icon="schedule"
              title={`Earth communication delay: ${delayLabel}`}
            >
              {delayLabel}
            </MissionPill>
            {!backendOnline ? (
              <MissionPill
                icon="cloud_off"
                tone="offline"
                title="Local API offline — cached emergency procedures remain ready"
              >
                API offline
              </MissionPill>
            ) : null}
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

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2 md:hidden">
        <MissionPill compact icon="rocket_launch">
          {`Day ${missionDay} · ${missionName}`}
        </MissionPill>
        <MissionPill compact icon="schedule">
          {delayLabel}
        </MissionPill>
        {!backendOnline ? (
          <MissionPill compact icon="cloud_off" tone="offline">
            API offline
          </MissionPill>
        ) : null}
      </div>
    </header>
  );
}
