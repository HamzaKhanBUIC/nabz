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
      className={`flex w-full flex-col justify-between rounded-lg border p-5 text-left transition-colors ${
        active
          ? "border-accent bg-raised"
          : "border-line bg-surface hover:bg-hover"
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted">{metric.label}</p>
          <p className="mt-1 flex items-baseline gap-1.5 font-mono text-2xl font-semibold text-primary">
            <span>{latest ? formatMetricValue(metricKey, latest.value) : "—"}</span>
            <span className="font-sans text-xs font-normal text-muted">
              {metric.unit}
            </span>
          </p>
        </div>

        <StatusBadge tone={status.badgeTone} dot={false}>
          <Icon name={status.iconName} size={14} />
          <span>{status.label}</span>
        </StatusBadge>
      </div>

      <p className="mt-3 text-xs text-muted">
        {band?.ready && band.mean != null
          ? `Mean ${formatMetricValue(metricKey, band.mean)} ${metric.unit} · ${series.length} pts`
          : `${series.length} sessions · ${status.label}`}
      </p>
    </button>
  );
}
