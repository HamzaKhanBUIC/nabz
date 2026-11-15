"use client";

import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { getLatestPoint, getTrendBand, getTrendSeries } from "@/lib/data/selectors";
import { METRICS, formatMetricValue, pointStatus } from "@/lib/utils/health";

export default function MetricCard({
  metricKey,
  store,
  active = false,
  onSelect,
}) {
  const metric = METRICS[metricKey];
  if (!metric) return null;

  const series = getTrendSeries(metricKey, store);
  const band = getTrendBand(metricKey, store);
  const latest = getLatestPoint(metricKey, store);
  const status = pointStatus(latest, band);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(metricKey)}
      aria-pressed={active}
      className={`interactive-surface flex w-full cursor-pointer flex-col justify-between rounded-lg border p-4 sm:p-5 text-left ${
        active
          ? "border-accent bg-raised"
          : "border-line bg-surface hover:border-line-strong hover:bg-hover"
      }`}
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-muted">
          {metric.label}
        </p>

        <StatusBadge tone={status.badgeTone} dot={false} className="shrink-0">
          <Icon name={status.iconName} size={14} />
          <span>{status.label}</span>
        </StatusBadge>
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 tabular-nums text-2xl font-semibold tabular-nums text-primary">
        <span className="whitespace-nowrap">
          {latest ? formatMetricValue(metricKey, latest.value) : "—"}
        </span>
        <span className="font-sans text-xs font-normal whitespace-nowrap text-muted">
          {metric.unit}
        </span>
      </p>

      <p className="mt-3 text-xs tabular-nums text-muted">
        {band?.ready && band.mean != null
          ? `Mean ${formatMetricValue(metricKey, band.mean)} ${metric.unit} · ${series.length} pts`
          : `${series.length} sessions · ${status.label}`}
      </p>
    </button>
  );
}
