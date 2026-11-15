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
          <h1 className="t-h1 mt-1 text-primary">Your normal zone</h1>
          <p className="mt-1 text-sm text-secondary">
            Your usual range, built from your own recent check-ins.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
          {DAY_RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              aria-pressed={rangeDays === days}
              className={`min-h-9 rounded-md px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-[transform,background-color,color] duration-150 ease-[var(--ease-smooth)] active:scale-95 ${
                rangeDays === days
                  ? "bg-accent text-on-status"
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

          <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">Latest reading</p>
              <p className="mt-1 tabular-nums text-base font-semibold tabular-nums text-primary">
                {latest ? `${formatMetricValue(selectedMetric, latest.value)} ${metric.unit}` : "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">Your usual level</p>
              <p className="mt-1 tabular-nums text-base font-semibold tabular-nums text-primary">
                {band?.ready && band.mean != null
                  ? `${formatMetricValue(selectedMetric, band.mean)} ${metric.unit}`
                  : "Still learning"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">We flag it at</p>
              <p className="mt-1 tabular-nums text-sm font-semibold tabular-nums text-primary">
                {band?.ready && band.watchAt != null
                  ? `Watch ${formatMetricValue(selectedMetric, band.watchAt)}${band.actAt != null ? ` · Act ${formatMetricValue(selectedMetric, band.actAt)}` : ""} ${metric.unit}`
                  : "Not enough readings yet"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
