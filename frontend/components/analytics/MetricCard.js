"use client";

/**
 * Metric summary card for the Normal Zone sidebar:
 * current value, personal baseline, trend and status.
 */

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import StatusBadge, { DemoBadge } from "@/components/ui/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { getBaseline, getMetricSeries } from "@/lib/data/selectors";
import {
  METRICS,
  metricStatus,
  trendDirection,
  trendLabel,
} from "@/lib/utils/health";
import { formatDateTime } from "@/lib/utils/format";

export default function MetricCard({ metricKey, store, active = false, onSelect }) {
  const metric = METRICS[metricKey];
  const series = getMetricSeries(metricKey, store);
  const baseline = getBaseline(metricKey, store);

  const latest = series.length ? series[series.length - 1] : null;
  const values = series.map((p) => p.value);
  const trend = trendDirection(values);
  const trendInfo = trendLabel(metricKey, trend);
  const status = metricStatus(metricKey, latest ? latest.value : null, baseline);

  const TrendIcon =
    trend === "rising" ? ArrowUpRight : trend === "falling" ? ArrowDownRight : Minus;

  const valueText = latest
    ? metric.integer
      ? String(Math.round(latest.value))
      : latest.value.toFixed(1)
    : "—";

  const content = (
    <CardBody className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted">{metric.shortLabel}</p>
          <p className="mt-1 font-mono text-2xl font-medium leading-none text-navy">
            {valueText}
            <span className="ml-1 text-xs font-normal text-muted">{metric.unit}</span>
          </p>
        </div>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            trend === "unknown"
              ? "bg-canvas text-muted"
              : trendInfo.tone === "warn"
                ? "bg-warn-soft text-warn"
                : "bg-ok-soft text-ok"
          }`}
          title={trendInfo.label}
        >
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted">Baseline</p>
          <p className="truncate font-mono text-xs text-navy">
            {baseline
              ? `${metric.integer ? Math.round(baseline.mean) : baseline.mean.toFixed(1)} ${metric.unit}`
              : "collecting…"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          {latest?.source === "demo" ? <DemoBadge /> : null}
        </div>
      </div>

      {latest ? (
        <p className="mt-2 font-mono text-[10px] text-muted">
          {formatDateTime(latest.timestamp)}
        </p>
      ) : null}
    </CardBody>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`block w-full rounded-xl text-left transition-shadow ${
          active
            ? "ring-2 ring-nasa-blue ring-offset-2 ring-offset-canvas"
            : "hover:shadow-[0_2px_8px_rgba(16,27,45,0.1)]"
        }`}
      >
        <Card>{content}</Card>
      </button>
    );
  }

  return <Card>{content}</Card>;
}
