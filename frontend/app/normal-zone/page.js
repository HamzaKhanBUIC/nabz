"use client";

import { useEffect, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import MetricCard from "@/components/analytics/MetricCard";
import HealthTrendChart from "@/components/analytics/HealthTrendChart";
import { useStore } from "@/lib/data/store";
import { METRICS, METRIC_KEYS, formatMetricValue, pointStatus } from "@/lib/utils/health";

const DAY_RANGES = [14, 30, 60, 120];

export default function NormalZonePage() {
  const store = useStore();
  const [selectedMetric, setSelectedMetric] = useState("reaction-speed");
  const [rangeDays, setRangeDays] = useState(30);

  const rangeKey = `${selectedMetric}:${rangeDays}`;
  const currentTrend =
    store.trendsByRange?.[rangeKey] || store.trends?.[selectedMetric];
  const loadingRange =
    store.hydrated && store.backendOnline && !store.trendsByRange?.[rangeKey];

  useEffect(() => {
    if (!store.hydrated) return undefined;
    if (store.trendsByRange?.[rangeKey]) return undefined;
    store.loadTrend(selectedMetric, rangeDays).catch(() => null);
    return undefined;
  }, [store, selectedMetric, rangeDays, rangeKey]);

  const metric = METRICS[selectedMetric];
  const points = currentTrend?.points || [];
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const band = currentTrend?.band;
  const status = pointStatus(latest, band);

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label-md text-muted">Personal baseline</p>
          <h1 className="t-h1 mt-1 text-primary">Your normal zone</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">
            Your normal range updates from your rolling 28-day history. Watch flags surface early shifts before fatigue or stress builds.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1 shadow-card">
          {DAY_RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              aria-pressed={rangeDays === days}
              className={`min-h-9 rounded-md px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-[transform,background-color,color] duration-150 ease-[var(--ease-smooth)] active:scale-95 ${
                rangeDays === days
                  ? "bg-accent text-on-status shadow-xs"
                  : "text-secondary hover:bg-hover hover:text-primary"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {METRIC_KEYS.map((key) => (
          <MetricCard
            key={key}
            metricKey={key}
            store={store}
            active={selectedMetric === key}
            onSelect={setSelectedMetric}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          title={metric.label}
          subtitle={`${metric.description}${loadingRange ? " · Updating..." : ""}`}
          action={
            <StatusBadge tone={status.badgeTone} dot={false}>
              <Icon name={status.iconName} size={14} />
              <span>{status.label}</span>
            </StatusBadge>
          }
        />

        <CardBody>
          <HealthTrendChart
            metricKey={selectedMetric}
            rangeDays={rangeDays}
            store={store}
            height={320}
          />

          <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Latest reading</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                {latest ? `${formatMetricValue(selectedMetric, latest.value)} ${metric.unit}` : "—"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Personal mean</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                {band?.ready && band.mean != null
                  ? `${formatMetricValue(selectedMetric, band.mean)} ${metric.unit}`
                  : "Building"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Watch / Act thresholds</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-primary">
                {band?.ready && band.watchAt != null
                  ? `${formatMetricValue(selectedMetric, band.watchAt)} / ${band.actAt != null ? formatMetricValue(selectedMetric, band.actAt) : "—"}`
                  : "Not ready"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-raised p-3.5">
              <p className="text-xs text-muted">Shift (z-score)</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-primary">
                {latest?.z != null ? Number(latest.z).toFixed(2) : "—"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
