"use client";

/**
 * Report preview for the Send to Earth page — shows the actual selected data.
 */

import {
  Activity,
  Droplets,
  Moon,
  Send,
  Smile,
} from "lucide-react";
import StatusBadge, { DemoBadge } from "@/components/ui/StatusBadge";
import { getMetricSeries } from "@/lib/data/selectors";
import { METRICS } from "@/lib/utils/health";
import { formatDateTime } from "@/lib/utils/format";

const SECTION_META = {
  reaction: { label: "Reaction trend", icon: Activity, unit: "ms", digits: 0 },
  sleep: { label: "Sleep hours", icon: Moon, unit: "h", digits: 1 },
  mood: { label: "Mood", icon: Smile, unit: "/5", digits: 0 },
  bloodPressure: { label: "Blood pressure reading", icon: Droplets, unit: "mmHg", digits: 0 },
};

export default function ReportPreview({ sections, store }) {
  const activeKeys = Object.keys(SECTION_META).filter((key) => sections[key]);

  if (activeKeys.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-5 py-8 text-center">
        <Send className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-navy">Nothing selected yet</p>
        <p className="mt-1 text-xs text-muted">
          Toggle at least one section to build the report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeKeys.map((key) => {
        const meta = SECTION_META[key];
        const Icon = meta.icon;
        const series = getMetricSeries(key, store);
        const hasDemo = series.some((p) => p.source === "demo");

        if (series.length === 0) {
          return (
            <div
              key={key}
              className="rounded-xl border border-line bg-canvas/60 px-4 py-3.5"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                <p className="text-sm font-medium text-navy">{meta.label}</p>
                <StatusBadge tone="neutral" dot={false} className="text-[10px]">
                  No data
                </StatusBadge>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                You have no recorded {METRICS[key].label.toLowerCase()} yet, so
                this section would be empty.
              </p>
            </div>
          );
        }

        // Summary computed from the real recorded series only.
        const values = series.map((p) => p.value);
        const latest = series[series.length - 1];
        const first = series[0];
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const change = latest.value - first.value;

        const fmt = (v) =>
          meta.digits === 0 ? Math.round(v) : v.toFixed(meta.digits);

        return (
          <div
            key={key}
            className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-nasa-blue" aria-hidden="true" />
                <p className="text-sm font-medium text-navy">{meta.label}</p>
              </span>
              <div className="flex items-center gap-1.5">
                {hasDemo ? <DemoBadge /> : null}
                <StatusBadge tone="info" dot={false} className="text-[10px]">
                  {series.length} point{series.length === 1 ? "" : "s"}
                </StatusBadge>
              </div>
            </div>

            <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Latest</dt>
                <dd className="font-mono text-navy">
                  {fmt(latest.value)}
                  <span className="ml-0.5 text-muted">
                    {key === "bloodPressure"
                      ? "mmHg systolic"
                      : meta.unit}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Average</dt>
                <dd className="font-mono text-navy">
                  {fmt(avg)}
                  <span className="ml-0.5 text-muted">{meta.unit}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Range</dt>
                <dd className="font-mono text-navy">
                  {fmt(min)}–{fmt(max)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Change</dt>
                <dd
                  className={`font-mono ${
                    change > 0 ? "text-warn" : change < 0 ? "text-ok" : "text-navy"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {fmt(change)}
                </dd>
              </div>
            </dl>

            <p className="mt-2 border-t border-line pt-2 font-mono text-[10px] text-muted">
              {formatDateTime(latest.timestamp)}
              {hasDemo ? " · includes demo record" : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
