"use client";

/**
 * "Normal zone" widget (handoff: 560px card — title, status pill, chart).
 * Band = personal normal range in `accent-subtle`, line + today dot in accent.
 *
 * Everything is derived from recorded values via the existing selectors —
 * nothing is fabricated when the crew has no history yet.
 */

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusBadge";
import ChartTooltip from "@/components/charts/ChartTooltip";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/lib/data/store";
import { getBaseline, getRange } from "@/lib/data/selectors";
import { classifyValue } from "@/lib/utils/health";
import { useClientTime } from "@/lib/hooks/useClientTime";

const METRIC_KEY = "reaction";
const RANGE_DAYS = 28;

function formatDay(date) {
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function useNormalZoneStatus() {
  const store = useStore();
  const now = useClientTime();
  const points = useMemo(
    () => getRange(METRIC_KEY, store, RANGE_DAYS, now),
    [store, now]
  );
  const baseline = useMemo(() => getBaseline(METRIC_KEY, store), [store]);
  const latest = points.length ? points[points.length - 1] : null;
  const classification = latest
    ? classifyValue(latest.value, baseline)
    : "unknown";

  return { points, baseline, latest, classification, now };
}

export default function NormalZoneWidget({ className = "" }) {
  const store = useStore();
  const now = useClientTime();

  const data = useMemo(
    () =>
      getRange(METRIC_KEY, store, RANGE_DAYS, now).map((point) => ({
        ...point,
        day: formatDay(point.date),
      })),
    [store, now]
  );
  const baseline = useMemo(() => getBaseline(METRIC_KEY, store), [store]);

  const latest = data.length ? data[data.length - 1] : null;
  const classification = latest ? classifyValue(latest.value, baseline) : "unknown";
  const inside = classification === "in-range";
  const status = !baseline || classification === "unknown" ? "normal" : inside ? "normal" : "attention";
  const statusLabel = !baseline
    ? "Building baseline"
    : classification === "unknown"
      ? "No reading today"
      : inside
        ? "Inside"
        : "Outside";

  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div className="min-w-0">
          <CardEyebrow>Normal zone</CardEyebrow>
          <h2 className="mt-1 t-h3 text-primary">Reaction time</h2>
        </div>
        <StatusPill status={status} className="shrink-0">
          {statusLabel}
        </StatusPill>
      </div>

      <div className="min-h-[200px] flex-1 px-6 pb-6 pt-4">
        {data.length === 0 ? (
          <EmptyState
            compact
            icon={null}
            title="No recorded reaction times yet"
            description="Your Normal Zone is drawn from your own check-ins. Complete one to start the chart."
            actionLabel="Start check-in"
            actionHref="/check-in"
          />
        ) : (
          <>
            <div className="h-[196px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 8, right: 10, bottom: 0, left: -18 }}
                >
                  <defs>
                    <linearGradient id="nzFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--color-line)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-line)" }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    width={54}
                  />
                  {baseline ? (
                    <ReferenceArea
                      y1={Math.round(baseline.lower)}
                      y2={Math.round(baseline.upper)}
                      fill="var(--color-accent-subtle)"
                      fillOpacity={1}
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
                    fill="url(#nzFill)"
                    dot={false}
                    activeDot={{ r: 4.5, fill: "var(--color-accent-hover)", strokeWidth: 0 }}
                  />
                  {latest ? (
                    <ReferenceDot
                      x={latest.day}
                      y={latest.value}
                      r={5}
                      fill="var(--color-accent-hover)"
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              Shaded band = your personal Normal Zone (recorded data only).
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
