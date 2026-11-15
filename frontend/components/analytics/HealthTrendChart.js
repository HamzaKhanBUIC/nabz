"use client";

/**
 * Analytics trend chart with metric + date-range selection.
 * Plots real recorded values with the personal baseline band behind them.
 */

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBaseline, getRange } from "@/lib/data/selectors";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { METRICS } from "@/lib/utils/health";
import ChartTooltip from "@/components/charts/ChartTooltip";

function formatTick(date, days) {
  if (days <= 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatTooltipDate(date) {
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function HealthTrendChart({ metricKey, rangeDays, store, height = 300 }) {
  const metric = METRICS[metricKey];
  // Range anchor — null until mounted (prerender-safe clock).
  const now = useClientTime();

  const data = useMemo(
    () =>
      getRange(metricKey, store, rangeDays, now).map((point) => ({
        ...point,
        tick: formatTick(point.date, rangeDays),
        tooltipLabel: formatTooltipDate(point.date),
      })),
    [metricKey, rangeDays, store, now]
  );

  const baseline = useMemo(() => getBaseline(metricKey, store), [metricKey, store]);

  const { domain, baselineDomain } = useMemo(() => {
    const values = data.map((p) => p.value);
    const pad = metric?.axisDomainPad ?? 10;
    let min = values.length ? Math.min(...values) : 0;
    let max = values.length ? Math.max(...values) : 10;
    if (baseline) {
      min = Math.min(min, baseline.lower);
      max = Math.max(max, baseline.upper);
    }
    if (metricKey === "mood") {
      min = 1;
      max = 5;
    }
    return {
      domain: [Math.floor((min - pad) * 10) / 10, Math.ceil((max + pad) * 10) / 10],
      baselineDomain: baseline
        ? [
            Math.floor((baseline.lower - pad) * 10) / 10,
            Math.ceil((baseline.upper + pad) * 10) / 10,
          ]
        : null,
    };
  }, [data, baseline, metric, metricKey]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-line bg-canvas/60 px-6 text-center">
        <p className="text-sm text-muted">
          No recorded {metric?.label.toLowerCase()} data in this range yet.
        </p>
      </div>
    );
  }

  // Nova accent; the `.recharts-line-curve` rule in globals.css re-maps the
  // stroke to the active theme, this value is the tooltip/legend fallback.
  const lineColor = "var(--color-accent)";

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: -10 }}>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="tick"
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-line)" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 11, fill: "var(--color-muted)", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          {baseline && baselineDomain ? (
            <ReferenceArea
              y1={baselineDomain[0]}
              y2={baselineDomain[1]}
              fill={lineColor}
              fillOpacity={0.07}
              stroke="none"
              ifOverflow="extendDomain"
            />
          ) : null}
          {baseline ? (
            <ReferenceLine
              y={Number(baseline.mean.toFixed(1))}
              stroke={lineColor}
              strokeDasharray="5 4"
              strokeOpacity={0.5}
              label={{
                value: "baseline",
                position: "insideTopRight",
                fill: "var(--color-muted)",
                fontSize: 10,
              }}
            />
          ) : null}
          <Tooltip
            cursor={{ stroke: "var(--color-line-strong)", strokeDasharray: "3 3" }}
            content={
              <ChartTooltip
                unit={` ${metric?.unit || ""}`}
                formatter={(value) =>
                  metric?.integer ? Math.round(value) : Number(value).toFixed(1)
                }
              />
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            name={metric?.label || "Value"}
            stroke={lineColor}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!cx || !cy) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.source === "demo" ? 3 : 3.5}
                  fill={payload.source === "demo" ? "var(--color-attention)" : lineColor}
                  stroke="var(--color-surface)"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 5.5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
