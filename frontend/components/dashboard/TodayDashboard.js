"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import MetricTile from "@/components/ui/MetricTile";
import StatusBadge from "@/components/ui/StatusBadge";
import TodayChecks from "@/components/dashboard/TodayChecks";
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
            How are you feeling today?
          </p>
        </div>

        <StatusBadge tone={overall.badgeTone} dot={false} className="shrink-0 py-1.5 text-sm">
          <Icon name={overall.iconName} size={16} />
          <span>{loading && !today ? "Syncing..." : overall.label}</span>
        </StatusBadge>
      </section>

      <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <TodayChecks checkin={latestCheckin} bp={latestBp} reminders={reminders} />
          <RadiationDoseCard />
        </div>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <section aria-label="Today's readings" className="grid divide-y divide-line rounded-lg border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <MetricTile
              bare
              label="Reaction speed"
              value={
                latestCheckin
                  ? formatMetricValue("reaction-speed", latestCheckin.metrics.meanSpeed)
                  : "—"
              }
              unit={latestCheckin ? "taps/s" : undefined}
              helper={
                latestCheckin && (latestCheckin.qcFlags?.length ?? 0) > 0
                  ? "Not scored today"
                  : latestCheckin
                  ? `At ${formatTime(latestCheckin.effectiveDateTime)}`
                  : "No check-in yet"
              }
            />

            <MetricTile
              bare
              label="Sleep"
              value={
                latestCheckin?.sleepHours != null
                  ? formatMetricValue("sleep-hours", latestCheckin.sleepHours)
                  : "—"
              }
              unit={latestCheckin?.sleepHours != null ? "hours" : undefined}
              helper={latestCheckin?.sleepHours != null ? "From your check-in" : "Logged at check-in"}
            />

            <MetricTile
              bare
              label="Blood pressure"
              value={
                latestBp
                  ? `${latestBp.average.systolic}/${latestBp.average.diastolic}`
                  : "—"
              }
              unit={latestBp ? "mmHg" : undefined}
              helper={latestBp ? `At ${formatTime(latestBp.effectiveDateTime)}` : "No reading yet"}
            />
          </section>

          <NormalZoneWidget />
          <ReminderCard />
        </div>
      </div>
    </div>
  );
}
