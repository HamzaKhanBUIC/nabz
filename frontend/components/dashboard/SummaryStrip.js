"use client";

/**
 * Reaction / Sleep / Mood summary strip for the Today dashboard.
 * Shows latest recorded value, baseline and trend per metric.
 */

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatusBadge, { DemoBadge } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/data/store";
import { getBaseline, getMetricSeries } from "@/lib/data/selectors";
import {
  METRICS,
  metricStatus,
  trendDirection,
  trendLabel,
} from "@/lib/utils/health";
import { relativeTime } from "@/lib/utils/format";

const SUMMARY_KEYS = ["reaction", "sleep", "mood"];

export default function SummaryStrip() {
  const store = useStore();

  return (
    <Card>
      <CardHeader
        title="Reaction, sleep & mood"
        subtitle="Latest recorded values"
        action={
          <Link
            href="/normal-zone"
            className="text-xs font-medium text-nasa-blue hover:underline"
          >
            Details
          </Link>
        }
      />
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUMMARY_KEYS.map((key) => {
          const metric = METRICS[key];
          const series = getMetricSeries(key, store);
          const baseline = getBaseline(key, store);
          const latest = series.length ? series[series.length - 1] : null;
          const trend = trendDirection(series.map((p) => p.value));
          const trendInfo = trendLabel(key, trend);
          const status = metricStatus(key, latest ? latest.value : null, baseline);
          const TrendIcon =
            trend === "rising"
              ? ArrowUpRight
              : trend === "falling"
                ? ArrowDownRight
                : Minus;

          return (
            <div
              key={key}
              className="flex flex-col gap-2 rounded-lg border border-line bg-canvas/70 px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  {metric.shortLabel}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded ${
                    trend === "unknown"
                      ? "bg-surface text-muted"
                      : trendInfo.tone === "warn"
                        ? "bg-warn-soft text-warn"
                        : "bg-ok-soft text-ok"
                  }`}
                  title={trendInfo.label}
                >
                  <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>

              <p className="font-mono text-xl font-medium leading-none text-navy">
                {latest
                  ? metric.integer
                    ? Math.round(latest.value)
                    : latest.value.toFixed(1)
                  : "—"}
                <span className="ml-1 text-[11px] font-normal text-muted">
                  {metric.unit}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge tone={status.tone} dot={false} className="text-[10px]">
                  {status.label}
                </StatusBadge>
                {latest?.source === "demo" ? (
                  <DemoBadge className="text-[10px]" />
                ) : null}
              </div>

              <p className="font-mono text-[10px] text-muted">
                {latest ? `Last: ${relativeTime(latest.timestamp)}` : "No records yet"}
              </p>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
