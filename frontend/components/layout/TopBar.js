"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useStore } from "@/lib/data/store";
import { useSession } from "@/lib/data/session";
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill border font-medium whitespace-nowrap ${palette} ${
        compact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <Icon name={icon} size={compact ? 14 : 16} />
      <span>{children}</span>
    </span>
  );
}

export default function TopBar({ onOpenMenu }) {
  const { mission, backendOnline } = useStore();
  const { isAuthenticated, crew, switchCrewMember } = useSession();
  const missionDay = mission?.missionDay ?? 1;
  const missionName = mission?.name || "Mars Transit Sim";
  const delayLabel = getEarthDelayLabel(mission);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex min-h-[64px] items-center justify-between gap-2 px-4 py-2 sm:min-h-[72px] sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-secondary transition-[transform,background-color,color] duration-150 ease-[var(--ease-smooth)] hover:bg-hover hover:text-primary active:scale-95 lg:hidden"
          >
            <Icon name="menu" size={22} />
          </button>

          <Link href={isAuthenticated ? "/" : "/real-data"} className="flex min-w-0 items-center gap-2.5 group">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-on-status shadow-xs transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:scale-[1.03]">
              <Icon name="pulse_alert" size={20} />
            </span>
            <span className="t-h3 truncate text-primary">{APP_NAME}</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <MissionPill
              icon="rocket_launch"
              title={`Mission day ${missionDay}: ${missionName}`}
            >
              {`Day ${missionDay} · ${missionName}`}
            </MissionPill>
            <MissionPill
              icon="schedule"
              title={`Earth communication delay: ${delayLabel}`}
            >
              {delayLabel}
            </MissionPill>
            {isAuthenticated && crew ? (
              <MissionPill
                icon="person"
                title={`Signed in as ${crew.name} (${crew.role})`}
              >
                {`${crew.name} · ${crew.role}`}
              </MissionPill>
            ) : null}
            {isAuthenticated && crew ? (
              <button
                type="button"
                onClick={switchCrewMember}
                className="hidden xl:inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
              >
                <Icon name="swap_horiz" size={16} />
                <span>Switch crew member</span>
              </button>
            ) : null}
            {!backendOnline ? (
              <MissionPill
                icon="cloud_off"
                tone="offline"
                title="Local API unreachable. Cached emergency guides stay ready."
              >
                Offline cache
              </MissionPill>
            ) : null}
          </div>

          <ThemeToggle />

          <Link
            href="/emergency"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emergency px-3.5 sm:px-4 text-sm font-semibold text-white shadow-sm shadow-emergency/25 transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:bg-emergency-hover active:scale-[0.98]"
            aria-label="Open emergency mode"
          >
            <Icon name="emergency" filled size={20} />
            <span className="hidden sm:inline">Emergency</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line/70 px-4 py-2 lg:hidden">
        <MissionPill compact icon="rocket_launch">
          {`Day ${missionDay} · ${missionName}`}
        </MissionPill>
        <MissionPill compact icon="schedule">
          {delayLabel}
        </MissionPill>
        {isAuthenticated && crew ? (
          <>
            <MissionPill compact icon="person">
              {`${crew.name} · ${crew.role}`}
            </MissionPill>
            <button
              type="button"
              onClick={switchCrewMember}
              className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-pill border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium text-secondary hover:bg-hover hover:text-primary"
            >
              <Icon name="swap_horiz" size={14} />
              <span>Switch crew member</span>
            </button>
          </>
        ) : null}
        {!backendOnline ? (
          <MissionPill compact icon="cloud_off" tone="offline">
            Offline cache
          </MissionPill>
        ) : null}
      </div>
    </header>
  );
}
