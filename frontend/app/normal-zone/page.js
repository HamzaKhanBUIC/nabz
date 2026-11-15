"use client";

/**
 * PAGE 4 — Normal Zone / Health Analytics.
 * Metric + date-range selection, real recorded history with the personal
 * baseline band, and a right column of metric cards.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Droplets,
  LineChart as LineChartIcon,
  Moon,
  Smile,
} from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatusBadge, { DemoBadge } from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import DemoDataNotice from "@/components/ui/DemoDataNotice";
import { DemoDataButton } from "@/components/ui/DemoDataAction";
import HealthTrendChart from "@/components/analytics/HealthTrendChart";
import MetricCard from "@/components/analytics/MetricCard";
import { useStore } from "@/lib/data/store";
import { getBaseline, getMetricSeries, hasAnyRecordedData } from "@/lib/data/selectors";
import { METRICS, METRIC_KEYS, metricStatus } from "@/lib/utils/health";
import { formatDateTime } from "@/lib/utils/format";
import { useClientTime } from "@/lib/hooks/useClientTime";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

const METRIC_ICONS = {
  reaction: Activity,
  sleep: Moon,
  mood: Smile,
  bloodPressure: Droplets,
};

export default function NormalZonePage() {
  const store = useStore();
  const [metricKey, setMetricKey] = useState("reaction");
  const [rangeDays, setRangeDays] = useState(28);

  const metric = METRICS[metricKey];
  const series = useMemo(
    () => getMetricSeries(metricKey, store),
    [metricKey, store]
  );
  const baseline = useMemo(() => getBaseline(metricKey, store), [metricKey, store]);

  // Anchor time for range filtering — null until mounted (Next forbids
  // current-time reads during prerender), then refreshed every minute.
  const rangeAnchor = useClientTime();

  const inRange = useMemo(() => {
    if (!rangeAnchor) return series;
    const cutoff = rangeAnchor.getTime() - rangeDays * 86_400_000;
    return series.filter((p) => p.date.getTime() >= cutoff);
  }, [series, rangeDays, rangeAnchor]);

  const latest = series.length ? series[series.length - 1] : null;
  const status = metricStatus(metricKey, latest ? latest.value : null, baseline);
  const MetricIcon = METRIC_ICONS[metricKey];

  const hasAnyData = METRIC_KEYS.some(
    (key) => getMetricSeries(key, store).length > 0
  );

  return (
    <PageTransition>
      <DemoDataNotice />

      <PageHeader
        eyebrow="Health analytics"
        title="Your Normal Zone"
        description="Personal baselines computed from your recorded check-ins and measurements. Shaded bands show your normal range — never a population average."
        actions={
          <Button href="/check-in" variant="secondary" size="md">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Start check-in
          </Button>
        }
      />

      {/* Status banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              status.tone === "ok"
                ? "bg-ok-soft text-ok"
                : status.tone === "warn"
                  ? "bg-warn-soft text-warn"
                  : "bg-canvas text-muted"
            }`}
          >
            <LineChartIcon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy">{status.label}</p>
            <p className="text-xs text-muted">
              {metric.label} ·{" "}
              {latest
                ? `latest ${metric.integer ? Math.round(latest.value) : latest.value.toFixed(1)} ${metric.unit} · ${formatDateTime(latest.timestamp)}`
                : "no readings yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latest?.source === "demo" ? <DemoBadge /> : null}
          <StatusBadge tone={baseline ? "info" : "neutral"}>
            {baseline
              ? `Baseline from ${baseline.count} readings`
              : `Needs ${3 - (series.length || 0)} more for baseline`}
          </StatusBadge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Chart column */}
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card>
            <CardHeader
              title={metric.label}
              subtitle={metric.description}
              icon={MetricIcon}
              action={
                <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-0.5">
                  {RANGES.map((range) => (
                    <button
                      key={range.days}
                      type="button"
                      onClick={() => setRangeDays(range.days)}
                      aria-pressed={rangeDays === range.days}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        rangeDays === range.days
                          ? "bg-surface text-navy shadow-card"
                          : "text-muted hover:text-navy"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              }
            />
            <CardBody>
              {/* Metric selector */}
              <div
                role="tablist"
                aria-label="Select metric"
                className="mb-4 flex flex-wrap gap-2"
              >
                {METRIC_KEYS.map((key) => {
                  const Icon = METRIC_ICONS[key];
                  const active = key === metricKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMetricKey(key)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                        active
                          ? "border-nasa-blue bg-nasa-blue text-white"
                          : "border-line bg-surface text-navy hover:border-nasa-blue/40 hover:bg-canvas"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {METRICS[key].shortLabel}
                    </button>
                  );
                })}
              </div>

              {inRange.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-canvas/60 px-6 py-12 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-muted">
                    <LineChartIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold text-navy">
                    No recorded history for {metric.label.toLowerCase()}
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                    {hasAnyRecordedData(store)
                      ? `You have no ${metric.label.toLowerCase()} records in the last ${rangeDays} days. Record one to see the trend.`
                      : "Charts only plot real recorded values. Complete a check-in or measurement to build your history — nothing is fabricated to fill this view."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      href={metric.source === "measurements" ? "/measure" : "/check-in"}
                      size="sm"
                    >
                      {metric.source === "measurements"
                        ? "Measure blood pressure"
                        : "Start check-in"}
                    </Button>
                    <DemoDataButton />
                  </div>
                </div>
              ) : (
                <HealthTrendChart
                  metricKey={metricKey}
                  rangeDays={rangeDays}
                  store={store}
                  height={320}
                />
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-5 rounded-sm bg-accent/15"
                      aria-hidden="true"
                    />
                    Normal Zone (mean ± 1 SD)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-attention"
                      aria-hidden="true"
                    />
                    Demo record
                  </span>
                </span>
                <span className="font-mono text-[11px]">
                  {inRange.length} point{inRange.length === 1 ? "" : "s"} in range
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Baseline detail */}
          <Card>
            <CardHeader
              title="Baseline detail"
              subtitle="How your Normal Zone is calculated"
            />
            <CardBody>
              {baseline ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Baseline (mean)
                    </p>
                    <p className="mt-1 font-mono text-lg font-medium text-navy">
                      {metric.integer
                        ? Math.round(baseline.mean)
                        : baseline.mean.toFixed(1)}
                      <span className="ml-1 text-[11px] font-normal text-muted">
                        {metric.unit}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Normal zone
                    </p>
                    <p className="mt-1 font-mono text-lg font-medium text-nasa-blue">
                      {metric.integer
                        ? `${Math.round(baseline.lower)}–${Math.round(baseline.upper)}`
                        : `${baseline.lower.toFixed(1)}–${baseline.upper.toFixed(1)}`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Recorded range
                    </p>
                    <p className="mt-1 font-mono text-lg font-medium text-navy">
                      {metric.integer
                        ? `${Math.round(baseline.min)}–${Math.round(baseline.max)}`
                        : `${baseline.min.toFixed(1)}–${baseline.max.toFixed(1)}`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-canvas/70 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Sample size
                    </p>
                    <p className="mt-1 font-mono text-lg font-medium text-navy">
                      {baseline.count}
                      <span className="ml-1 text-[11px] font-normal text-muted">
                        readings
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Your Normal Zone appears after 3 recorded {metric.label.toLowerCase()}{" "}
                  readings. Until then, no baseline is shown — we never guess one.
                </p>
              )}

              <p className="mt-4 rounded-lg border border-line bg-canvas/60 px-3.5 py-3 text-xs leading-relaxed text-muted">
                Baselines are recomputed from your own history only. Demo
                records (labelled &ldquo;Demo&rdquo;) are excluded from being
                mistaken for real measurements.
              </p>

              {!hasAnyData ? (
                <div className="mt-4 flex items-center gap-3">
                  <Button href="/check-in" size="sm">
                    Record your first check-in
                  </Button>
                  <DemoDataButton />
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        {/* Metric cards column */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-nasa-blue">
            Metric snapshot
          </p>
          {METRIC_KEYS.map((key) => (
            <MetricCard
              key={key}
              metricKey={key}
              store={store}
              active={key === metricKey}
              onSelect={() => setMetricKey(key)}
            />
          ))}

          <Link
            href="/send-to-earth"
            className="mt-2 rounded-xl border border-accent/40 bg-accent-subtle px-4 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-hover"
          >
            Share a summary with Earth →
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
