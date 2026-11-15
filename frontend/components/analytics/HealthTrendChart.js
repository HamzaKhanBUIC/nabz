"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/lib/data/store";
import { METRICS, formatMetricValue } from "@/lib/utils/health";
import { zoneToLabel } from "@/lib/api";

function TrendTooltip({ active, payload, unit, code }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-primary">Mission day {pt.missionDay}</p>
      <p className="mt-1 text-secondary">
        Value: <span className="font-mono font-semibold text-primary">{formatMetricValue(code, pt.value)} {unit}</span>
      </p>
      <p className="text-muted">
        Z-score: {pt.z != null ? Number(pt.z).toFixed(2) : "—"} · {zoneToLabel(pt.zone)}
      </p>
    </div>
  );
}

export default function HealthTrendChart({
  metricKey,
  rangeDays = 30,
  store,
  height = 300,
}) {
  const { hydrated } = useStore();
  const metric = METRICS[metricKey];
  const trend =
    store?.trendsByRange?.[`${metricKey}:${rangeDays}`] ||
    store?.trends?.[metricKey];
  const points = trend?.points || [];
  const band = trend?.band;
  const referenceRange = trend?.referenceRange;

  if (!metric) return null;

  const data = points.map((pt) => ({
    day: `D${pt.missionDay}`,
    missionDay: pt.missionDay,
    value: Number(pt.value),
    z: pt.z,
    zone: pt.zone,
  }));

  return (
    <div className="space-y-3">
      <div style={{ height }} className="w-full">
        {hydrated && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: -8 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                content={<TrendTooltip unit={metric.unit} code={metricKey} />}
              />
              {band?.ready && band.mean != null ? (
                <ReferenceLine
                  y={band.mean}
                  stroke="var(--color-normal)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Mean",
                    position: "insideTopLeft",
                    fill: "var(--color-normal)",
                    fontSize: 11,
                  }}
                />
              ) : null}
              {band?.ready && band.watchAt != null ? (
                <ReferenceLine
                  y={band.watchAt}
                  stroke="var(--color-attention)"
                  strokeDasharray="3 3"
                  label={{
                    value: "Watch",
                    position: "insideTopLeft",
                    fill: "var(--color-attention)",
                    fontSize: 11,
                  }}
                />
              ) : null}
              {band?.ready && band.actAt != null ? (
                <ReferenceLine
                  y={band.actAt}
                  stroke="var(--color-emergency)"
                  strokeDasharray="3 3"
                  label={{
                    value: "Act",
                    position: "insideBottomLeft",
                    fill: "var(--color-emergency)",
                    fontSize: 11,
                  }}
                />
              ) : null}
              {referenceRange ? (
                <ReferenceLine
                  y={referenceRange.high}
                  stroke="var(--color-muted)"
                  strokeDasharray="2 2"
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: metric.color }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-line bg-raised text-sm text-muted">
            {hydrated ? "No data points in this window." : "Loading chart..."}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          Source: <strong className="text-secondary">{trend?.source || "simulated"}</strong> · Window: {rangeDays} days
        </span>
        {referenceRange ? (
          <span>
            Reference range: {referenceRange.low} to {referenceRange.high} {metric.unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
