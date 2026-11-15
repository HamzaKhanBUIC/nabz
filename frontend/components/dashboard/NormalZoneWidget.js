"use client";

import Link from "next/link";
import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ChartTooltip from "@/components/charts/ChartTooltip";
import { useStore } from "@/lib/data/store";
import { METRICS, formatMetricValue, pointStatus } from "@/lib/utils/health";

export function useNormalZoneStatus(code = "reaction-speed") {
  const store = useStore();
  const trend = store.trends?.[code];
  const points = trend?.points || [];
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const band = trend?.band || null;
  return {
    metric: METRICS[code],
    trend,
    points,
    latest,
    band,
    status: pointStatus(latest, band),
  };
}

export default function NormalZoneWidget({ className = "", code = "reaction-speed" }) {
  const { hydrated } = useStore();
  const { metric, points, latest, band, status } = useNormalZoneStatus(code);

  const chartData = points.map((pt) => ({
    day: `D${pt.missionDay}`,
    missionDay: pt.missionDay,
    value: Number(pt.value),
    zone: pt.zone,
  }));

  const hasWatch = band?.ready && band.mean != null && band.watchAt != null;
  const hasAct = band?.ready && band.actAt != null;
  const bandLow = hasAct ? Math.min(band.mean, band.actAt) : hasWatch ? Math.min(band.mean, band.watchAt) : null;
  const bandHigh = hasWatch ? Math.max(band.mean, band.watchAt) : null;

  return (
    <Card className={className}>
      <CardHeader
        title="Your normal zone"
        subtitle={
          latest
            ? `Latest ${metric.shortLabel.toLowerCase()}: ${formatMetricValue(code, latest.value)} ${metric.unit} (Day ${latest.missionDay})`
            : "30-day personal baseline"
        }
        action={
          <StatusBadge tone={status.badgeTone} dot={false}>
            <Icon name={status.iconName} size={14} />
            <span>{status.label}</span>
          </StatusBadge>
        }
      />

      <div className="mt-4 h-[220px] w-full">
        {hydrated && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: -12 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    unit={` ${metric.unit}`}
                    formatter={(v) => formatMetricValue(code, v)}
                  />
                }
              />
              {hasWatch && bandHigh != null ? (
                <ReferenceArea
                  y1={band.watchAt}
                  y2={bandHigh + (band.sd || 0)}
                  fill="var(--color-normal)"
                  fillOpacity={0.08}
                />
              ) : null}
              {band?.ready && band.mean != null ? (
                <ReferenceLine
                  y={band.mean}
                  stroke="var(--color-normal)"
                  strokeDasharray="4 4"
                />
              ) : null}
              {hasWatch ? (
                <ReferenceLine
                  y={band.watchAt}
                  stroke="var(--color-attention)"
                  strokeDasharray="3 3"
                />
              ) : null}
              {hasAct && bandLow != null ? (
                <ReferenceLine
                  y={band.actAt}
                  stroke="var(--color-emergency)"
                  strokeDasharray="3 3"
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: metric.color }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-line bg-raised text-sm text-muted">
            {hydrated ? "Loading trend points..." : "Preparing chart..."}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
        <span>
          {band?.ready && band.mean != null
            ? `Baseline mean ${formatMetricValue(code, band.mean)} ${metric.unit} (watch ${formatMetricValue(code, band.watchAt)}, act ${formatMetricValue(code, band.actAt)})`
            : "Building personal baseline (minimum 3 valid sessions)."}
        </span>
        <Link
          href="/normal-zone"
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          <span>Explore all 4 metrics</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>
    </Card>
  );
}
