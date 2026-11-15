"use client";

/**
 * Dashboard Normal Zone chart: last 28 days of recorded reaction time with
 * the personal baseline band (mean ± 1 SD) drawn behind the series.
 * Renders an empty state when no recorded data exists.
 */

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/lib/data/store";
import { getBaseline, getRange } from "@/lib/data/selectors";
import { useClientTime } from "@/lib/hooks/useClientTime";
import ChartTooltip from "@/components/charts/ChartTooltip";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { LineChart } from "lucide-react";

const METRIC_KEY = "reaction";
const RANGE_DAYS = 28;

function formatDay(date) {
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function NormalZoneChart() {
  const store = useStore();
  const [rangeDays, setRangeDays] = useState(RANGE_DAYS);
  // Range anchor — null until mounted (prerender-safe clock).
  const now = useClientTime();

  const data = useMemo(
    () =>
      getRange(METRIC_KEY, store, rangeDays, now).map((point) => ({
        ...point,
        day: formatDay(point.date),
      })),
    [store, rangeDays, now]
  );
  const baseline = useMemo(() => getBaseline(METRIC_KEY, store), [store]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        compact
        title="No data for this range yet"
        description="The Normal Zone chart plots your recorded reaction time. Complete a check-in to start your history."
        actionLabel="Start check-in"
        actionHref="/check-in"
      />
    );
  }

  // For a single point, widen the domain so it still renders sensibly.
  const values = data.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const pad = Math.max(20, (maxValue - minValue) * 0.3);
  const domain = [Math.floor(minValue - pad), Math.ceil(maxValue + pad)];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge tone={baseline ? "info" : "neutral"}>
            {baseline
              ? `Normal zone ${Math.round(baseline.lower)}–${Math.round(baseline.upper)} ms`
              : "Building baseline"}
          </StatusBadge>
          <span className="font-mono text-[11px] text-muted">
            {data.length} recorded point{data.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-0.5">
          {[7, 14, 28].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              aria-pressed={rangeDays === days}
              className={`rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                rangeDays === days
                  ? "bg-surface text-navy shadow-card"
                  : "text-muted hover:text-navy"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="reactionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 11, fill: "var(--color-muted)", fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              width={54}
            />
            {baseline ? (
              <ReferenceArea
                y1={Math.round(baseline.lower)}
                y2={Math.round(baseline.upper)}
                fill="var(--color-accent-subtle)"
                fillOpacity={0.8}
                stroke="none"
                ifOverflow="extendDomain"
              />
            ) : null}
            <Tooltip
              cursor={{ stroke: "var(--color-accent)", strokeDasharray: "3 3" }}
              content={<ChartTooltip unit=" ms" />}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Reaction time"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="url(#reactionFill)"
              dot={{ r: 2.5, fill: "var(--color-accent)", strokeWidth: 0 }}
              activeDot={{ r: 4.5, fill: "var(--color-emergency)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-muted">
          Shaded band = your personal Normal Zone (recorded data only).
        </p>
        <Button href="/normal-zone" variant="ghost" size="sm">
          Open analytics
        </Button>
      </div>
    </div>
  );
}
