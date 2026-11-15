"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import MetricTile from "@/components/ui/MetricTile";
import StatusBadge from "@/components/ui/StatusBadge";
import ClinicalActionCard from "@/components/dashboard/ClinicalActionCard";
import NormalZoneWidget from "@/components/dashboard/NormalZoneWidget";
import ReminderCard from "@/components/dashboard/ReminderCard";
import RadiationDoseCard from "@/components/hazards/RadiationDoseCard";
import { useStore } from "@/lib/data/store";
import { useSession } from "@/lib/data/session";
import { getCommander } from "@/lib/data/mission";
import { getOverallStatus } from "@/lib/data/selectors";
import { formatMetricValue } from "@/lib/utils/health";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { formatTime, greetingFor } from "@/lib/utils/format";

export default function TodayDashboard() {
  const { mission, today, loading, backendOnline, error } = useStore();
  const { crew } = useSession();
  const now = useClientTime(60_000);
  const activeCrew = crew || getCommander(mission);
  const overall = getOverallStatus(today);

  const greeting = now ? greetingFor(now) : "Mission brief";
  const latestCheckin = today?.checkin;
  const latestBp = today?.bp;
  const secondaryCards = (today?.cards || []).filter(
    (c) => c.id !== today?.card?.id,
  );

  return (
    <div className="space-y-6">
      {!backendOnline && error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-attention/40 bg-attention/10 px-4 py-3 text-sm text-primary"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon name="cloud_off" size={20} className="shrink-0 text-attention" />
            <span>
              Local server unreachable ({error}). Cached offline emergency guides stay ready.
            </span>
          </div>
          <Link
            href="/emergency"
            className="shrink-0 font-semibold text-emergency underline-offset-2 hover:underline"
          >
            Open Emergency
          </Link>
        </div>
      ) : null}

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label-md text-muted">
            Day {today?.missionDay ?? mission?.missionDay ?? 1} · {mission?.name || "Mars Transit Sim"}
          </p>
          <h1 className="t-h1 mt-1 text-primary">
            {greeting}, {activeCrew.name}
          </h1>
          <p className="t-body-md mt-1 text-secondary">
            Reaction speed, sleep, and blood pressure against your personal normal.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href="/real-data"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
          >
            <Icon name="biotech" size={16} className="text-accent" />
            <span>Real astronaut data</span>
          </Link>
          <StatusBadge tone={overall.badgeTone} dot={false} className="py-1.5 text-sm">
            <Icon name={overall.iconName} size={16} />
            <span>{loading && !today ? "Syncing..." : overall.label}</span>
          </StatusBadge>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/check-in"
          className="interactive-surface flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent px-5 py-4 text-on-status shadow-sm shadow-accent/20 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/25"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">3-min check-in</p>
            <p className="text-xs opacity-90">Reaction test + sleep</p>
          </div>
          <Icon name="touch_app" size={24} className="shrink-0" />
        </Link>

        <Link
          href="/measure/blood-pressure"
          className="interactive-surface flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-primary shadow-card hover:border-line-strong hover:bg-hover"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">Blood pressure</p>
            <p className="text-xs text-muted">Guided 8-step cuff check</p>
          </div>
          <Icon name="monitor_heart" size={24} className="shrink-0 text-accent" />
        </Link>

        <Link
          href="/coach"
          className="interactive-surface flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-primary shadow-card hover:border-line-strong hover:bg-hover"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">Offline coach</p>
            <p className="text-xs text-muted">Questions about your readings</p>
          </div>
          <Icon name="smart_toy" size={24} className="shrink-0 text-accent" />
        </Link>

        <Link
          href="/send-to-earth"
          className="interactive-surface flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-primary shadow-card hover:border-line-strong hover:bg-hover"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">Send to Earth</p>
            <p className="text-xs text-muted">Prepare downlink report</p>
          </div>
          <Icon name="send" size={24} className="shrink-0 text-accent" />
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile
          label="Today's reaction speed"
          value={
            latestCheckin
              ? formatMetricValue("reaction-speed", latestCheckin.metrics.meanSpeed)
              : "—"
          }
          unit={latestCheckin ? "resp/s" : undefined}
          helper={
            latestCheckin
              ? `Median RT ${Math.round(latestCheckin.metrics.medianRtMs ?? 0)} ms · ${formatTime(latestCheckin.effectiveDateTime)}`
              : "No check-in logged today"
          }
        />

        <MetricTile
          label="Today's sleep"
          value={
            latestCheckin?.sleepHours != null
              ? formatMetricValue("sleep-hours", latestCheckin.sleepHours)
              : "—"
          }
          unit={latestCheckin?.sleepHours != null ? "hours" : undefined}
          helper={
            latestCheckin?.sleepHours != null
              ? "Logged with check-in"
              : "Log hours rested at check-in"
          }
        />

        <MetricTile
          label="Today's blood pressure"
          value={
            latestBp
              ? `${latestBp.average.systolic}/${latestBp.average.diastolic}`
              : "—"
          }
          unit={latestBp ? "mmHg" : undefined}
          helper={
            latestBp
              ? `Category: ${latestBp.category} · ${formatTime(latestBp.effectiveDateTime)}`
              : "No reading logged today"
          }
        />
      </section>

      <ClinicalActionCard card={today?.card} heading="Today's focus" />

      {secondaryCards.length > 0 ? (
        <div className="space-y-4">
          {secondaryCards.map((card) => (
            <ClinicalActionCard
              key={card.id}
              card={card}
              heading="Also keep in mind"
              compact
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        <NormalZoneWidget />
        <ReminderCard />
      </div>

      <RadiationDoseCard />
    </div>
  );
}
