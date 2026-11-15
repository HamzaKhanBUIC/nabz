"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import MetricTile from "@/components/ui/MetricTile";
import StatusBadge from "@/components/ui/StatusBadge";
import TodayChecks from "@/components/dashboard/TodayChecks";
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
  const { mission, today, reminders, loading, backendOnline, error } = useStore();
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

      <section className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="t-h1 text-primary">
            {greeting}, {activeCrew.name}
          </h1>
          <p className="t-body-md mt-1 text-secondary">
            Reaction speed, sleep, and blood pressure against your personal normal.
          </p>
        </div>

        <StatusBadge tone={overall.badgeTone} dot={false} className="shrink-0 py-1.5 text-sm">
          <Icon name={overall.iconName} size={16} />
          <span>{loading && !today ? "Syncing..." : overall.label}</span>
        </StatusBadge>
      </section>

      <TodayChecks checkin={latestCheckin} bp={latestBp} reminders={reminders} />

      <section aria-label="Today's readings" className="grid divide-y divide-line rounded-lg border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-y-0">
        <MetricTile
          bare
          label="Today's reaction speed"
          value={
            latestCheckin
              ? formatMetricValue("reaction-speed", latestCheckin.metrics.meanSpeed)
              : "—"
          }
          unit={latestCheckin ? "resp/s" : undefined}
          helper={
            latestCheckin && (latestCheckin.qcFlags?.length ?? 0) > 0
              ? "Not scored: failed the quality checks"
              : latestCheckin
              ? `Median RT ${Math.round(latestCheckin.metrics.medianRtMs ?? 0)} ms · ${formatTime(latestCheckin.effectiveDateTime)}`
              : "No check-in logged today"
          }
        />

        <MetricTile
          bare
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
          bare
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
