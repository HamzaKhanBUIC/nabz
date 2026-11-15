"use client";

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
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { pointStatus } from "@/lib/utils/health";

function dotFillForLevel(level) {
  switch (level) {
    case "in_zone":
      return "var(--color-normal)";
    case "watch":
      return "var(--color-attention)";
    case "act":
    case "urgent":
      return "var(--color-emergency)";
    default:
      return "var(--color-accent)";
  }
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  const num = Number(value);
  if (Math.abs(num) >= 100) return num.toFixed(1).replace(/\.0$/, "");
  if (Math.abs(num) >= 10) return num.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
  return num.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}

function NasaTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2.5 text-xs shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-primary">{pt.label}</p>
        <span className="text-xs text-muted">{pt.phase}</span>
      </div>
      <p className="mt-1 text-secondary">
        Value:{" "}
        <span className="tabular-nums font-semibold text-primary">
          {formatNumber(pt.value)} {unit}
        </span>
      </p>
      <p className="mt-0.5 text-muted">
        Z-score: {pt.z != null ? Number(pt.z).toFixed(2) : "Pre-launch baseline"}
      </p>
      <div className="mt-2">
        <StatusBadge tone={pt.status.badgeTone} dot={false}>
          <Icon name={pt.status.iconName} size={14} />
          <span>{pt.status.label}</span>
        </StatusBadge>
      </div>
    </div>
  );
}

function ZonePointDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const fill = dotFillForLevel(payload.status?.level);
  return (
    <circle
      key={payload.label}
      cx={cx}
      cy={cy}
      r={5}
      fill={fill}
      stroke="var(--color-surface)"
      strokeWidth={2}
    />
  );
}

export default function NasaTrendChart({
  trend,
  timepoints = [],
  analyteLabel = "",
  height = 320,
}) {
  const points = trend?.points || [];
  const band = trend?.band || null;
  const referenceRange = trend?.referenceRange || null;
  const unit = trend?.unit || "";

  const labelByRelativeDay = new Map(
    (timepoints || []).map((tp) => [tp.relativeDay, tp.label]),
  );

  const data = points.map((pt) => {
    const label =
      labelByRelativeDay.get(pt.missionDay) ??
      (pt.missionDay < 0 ? `L${pt.missionDay}` : `R+${pt.missionDay}`);
    const status = pointStatus(pt, band);
    return {
      label,
      missionDay: pt.missionDay,
      phase: pt.missionDay < 0 ? "Pre-launch" : "Post-flight",
      value: Number(pt.value),
      z: pt.z,
      zone: pt.zone,
      status,
    };
  });

  const allValues = data.map((d) => d.value);
  if (band?.ready && band.mean != null) allValues.push(Number(band.mean));
  if (band?.ready && band.watchAt != null) allValues.push(Number(band.watchAt));
  if (band?.ready && band.actAt != null) allValues.push(Number(band.actAt));
  if (referenceRange?.low != null) allValues.push(Number(referenceRange.low));
  if (referenceRange?.high != null) allValues.push(Number(referenceRange.high));

  let yDomain = ["auto", "auto"];
  if (allValues.length > 0) {
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = max - min || Math.abs(max) * 0.1 || 1;
    const pad = span * 0.12;
    yDomain = [
      Number((min - pad).toFixed(3)),
      Number((max + pad).toFixed(3)),
    ];
  }

  return (
    <div className="space-y-4">
      <div style={{ height }} className="w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 14, right: 18, bottom: 8, left: -4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={54}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<NasaTooltip unit={unit} />} />

              {referenceRange ? (
                <ReferenceArea
                  y1={referenceRange.low}
                  y2={referenceRange.high}
                  ifOverflow="extendDomain"
                  fill="var(--color-accent)"
                  fillOpacity={0.07}
                />
              ) : null}

              {band?.ready && band.mean != null && band.watchAt != null ? (
                <ReferenceArea
                  y1={Math.min(band.mean, band.watchAt)}
                  y2={Math.max(band.mean, band.watchAt)}
                  ifOverflow="extendDomain"
                  fill="var(--color-normal)"
                  fillOpacity={0.08}
                />
              ) : null}

              {referenceRange ? (
                <ReferenceLine
                  y={referenceRange.high}
                  ifOverflow="extendDomain"
                  stroke="var(--color-accent)"
                  strokeDasharray="2 4"
                  label={{
                    value: `Lab high (${formatNumber(referenceRange.high)})`,
                    position: "insideTopRight",
                    fill: "var(--color-accent)",
                    fontSize: 12,
                  }}
                />
              ) : null}

              {referenceRange ? (
                <ReferenceLine
                  y={referenceRange.low}
                  ifOverflow="extendDomain"
                  stroke="var(--color-accent)"
                  strokeDasharray="2 4"
                  label={{
                    value: `Lab low (${formatNumber(referenceRange.low)})`,
                    position: "insideBottomRight",
                    fill: "var(--color-accent)",
                    fontSize: 12,
                  }}
                />
              ) : null}

              {band?.ready && band.mean != null ? (
                <ReferenceLine
                  y={band.mean}
                  ifOverflow="extendDomain"
                  stroke="var(--color-normal)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Personal mean (${formatNumber(band.mean)})`,
                    position: "insideTopLeft",
                    fill: "var(--color-normal)",
                    fontSize: 12,
                  }}
                />
              ) : null}

              {band?.ready && band.watchAt != null ? (
                <ReferenceLine
                  y={band.watchAt}
                  ifOverflow="extendDomain"
                  stroke="var(--color-attention)"
                  strokeDasharray="3 3"
                  label={{
                    value: `Watch (${formatNumber(band.watchAt)})`,
                    position: "insideTopLeft",
                    fill: "var(--color-attention)",
                    fontSize: 12,
                  }}
                />
              ) : null}

              {band?.ready && band.actAt != null ? (
                <ReferenceLine
                  y={band.actAt}
                  ifOverflow="extendDomain"
                  stroke="var(--color-emergency)"
                  strokeDasharray="3 3"
                  label={{
                    value: `Act (${formatNumber(band.actAt)})`,
                    position: "insideBottomLeft",
                    fill: "var(--color-emergency)",
                    fontSize: 12,
                  }}
                />
              ) : null}

              <Line
                type="monotone"
                dataKey="value"
                name={analyteLabel || trend?.code || "Value"}
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                dot={<ZonePointDot />}
                activeDot={{ r: 7 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-line bg-raised text-sm text-muted">
            No blood count samples returned for this selection.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full bg-normal"
            aria-hidden="true"
          />
          <span>Personal band (from all earlier samples)</span>
        </span>
        {referenceRange ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>
              Lab reference range: {formatNumber(referenceRange.low)} to{" "}
              {formatNumber(referenceRange.high)} {unit}
            </span>
          </span>
        ) : null}
      </div>

      {data.length > 0 ? (
        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-xs font-semibold text-muted">
            Timepoint breakdown
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((pt) => (
              <li
                key={`${pt.missionDay}-${pt.label}`}
                className="flex flex-col justify-between gap-2 rounded-md border border-line bg-raised p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="tabular-nums text-sm font-semibold text-primary">
                    {pt.label}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {pt.phase}
                  </span>
                </div>

                <div>
                  <p className="tabular-nums text-base font-semibold tabular-nums text-primary">
                    {formatNumber(pt.value)}{" "}
                    <span className="font-sans text-xs font-normal text-muted">
                      {unit}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {pt.z != null
                      ? `Z-score: ${Number(pt.z).toFixed(2)}`
                      : "Pre-launch calibration"}
                  </p>
                </div>

                <div>
                  <StatusBadge tone={pt.status.badgeTone} dot={false}>
                    <Icon name={pt.status.iconName} size={14} />
                    <span>{pt.status.label}</span>
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
