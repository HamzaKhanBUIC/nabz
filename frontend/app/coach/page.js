"use client";

/**
 * PAGE 6 — AI Health Coach.
 * Conversation + context panel (today's summary, trends, suggested questions).
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Moon,
  Send,
  Smile,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import ChatInterface from "@/components/coach/ChatInterface";
import { useStore } from "@/lib/data/store";
import { getBaseline, getLatestValue, getMetricSeries, getOverallStatus } from "@/lib/data/selectors";
import { METRICS, METRIC_KEYS, metricStatus, trendDirection, trendLabel } from "@/lib/utils/health";
import { relativeTime } from "@/lib/utils/format";
import { coachDisclaimer } from "@/lib/data/mission";

const CONTEXT_METRICS = ["reaction", "sleep", "mood"];

export default function CoachPage() {
  const store = useStore();

  const overall = useMemo(() => getOverallStatus(store), [store]);

  const trends = useMemo(
    () =>
      METRIC_KEYS.map((key) => {
        const series = getMetricSeries(key, store);
        const baseline = getBaseline(key, store);
        const latest = getLatestValue(key, store);
        const trend = trendDirection(series.map((p) => p.value));
        return {
          key,
          metric: METRICS[key],
          baseline,
          latest,
          trend,
          trendInfo: trendLabel(key, trend),
          status: metricStatus(key, latest ? latest.value : null, baseline),
        };
      }),
    [store]
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="AI-assisted guidance"
        title="AI Health Coach"
        description="Ask questions about your readings and trends. Responses in this build are clearly-labelled placeholders — the real model will connect later."
        actions={
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-navy shadow-card transition-colors hover:bg-canvas"
          >
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
            Back to dashboard
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Conversation */}
        <div className="xl:col-span-2">
          <ChatInterface />
        </div>

        {/* Context panel */}
        <aside className="flex flex-col gap-5" aria-label="Coach context">
          {/* Today's summary */}
          <Card>
            <CardHeader
              title="Today's health summary"
              subtitle="Context the coach can reference"
              icon={Activity}
              action={<StatusBadge tone={overall.tone}>{overall.title}</StatusBadge>}
            />
            <CardBody className="space-y-3">
              <p className="text-sm leading-relaxed text-muted">{overall.detail}</p>

              <ul className="space-y-2">
                {CONTEXT_METRICS.map((key) => {
                  const trend = trends.find((t) => t.key === key);
                  const Icon =
                    trend.trend === "rising"
                      ? TrendingUp
                      : trend.trend === "falling"
                        ? TrendingDown
                        : Activity;
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/70 px-3 py-2.5"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            trend.trendInfo.tone === "warn" ? "text-warn" : "text-ok"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate text-xs font-medium text-navy">
                          {trend.metric.shortLabel}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-xs text-navy">
                          {trend.latest
                            ? `${trend.metric.integer ? Math.round(trend.latest.value) : trend.latest.value.toFixed(1)} ${trend.metric.unit}`
                            : "—"}
                        </span>
                        <StatusBadge tone={trend.status.tone} dot={false} className="text-[10px]">
                          {trend.status.label}
                        </StatusBadge>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="font-mono text-[10px] text-muted">
                Last activity:{" "}
                {store.checkIns[0]
                  ? relativeTime(store.checkIns[0].timestamp)
                  : "no check-ins yet"}
              </p>
            </CardBody>
          </Card>

          {/* Health trends */}
          <Card>
            <CardHeader
              title="Relevant health trends"
              subtitle="Baseline vs latest"
              icon={TrendingUp}
            />
            <CardBody className="space-y-2.5">
              {trends.map((trend) => (
                <div
                  key={trend.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/70 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-navy">
                      {trend.metric.shortLabel}
                    </p>
                    <p className="font-mono text-[10px] text-muted">
                      {trend.baseline
                        ? `baseline ${trend.metric.integer ? Math.round(trend.baseline.mean) : trend.baseline.mean.toFixed(1)} ${trend.metric.unit}`
                        : "baseline collecting"}
                    </p>
                  </div>
                  <StatusBadge tone={trend.trendInfo.tone} dot={false} className="text-[10px]">
                    {trend.trendInfo.label}
                  </StatusBadge>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Suggested questions */}
          <Card>
            <CardHeader
              title="Suggested questions"
              subtitle="Tap to send in the chat"
              icon={Bot}
            />
            <CardBody className="space-y-2">
              {[
                { label: "Is this serious?", icon: Activity },
                { label: "What if it gets worse?", icon: Moon },
                { label: "Should I tell Earth?", icon: Send },
              ].map((question) => (
                <Link
                  key={question.label}
                  href="/coach"
                  onClick={(event) => {
                    // Dispatch a custom event the chat input listens for.
                    event.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("crewpulse:coach-question", {
                        detail: { question: question.label },
                      })
                    );
                  }}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas/70 px-3 py-2.5 text-sm text-navy transition-colors hover:border-nasa-blue/40 hover:bg-nasa-blue-soft hover:text-nasa-blue"
                >
                  <question.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {question.label}
                </Link>
              ))}
              <p className="pt-1 text-[11px] leading-relaxed text-muted">
                {coachDisclaimer}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs text-muted">
                <Smile className="h-4 w-4 shrink-0" aria-hidden="true" />
                Log today&apos;s mood on the dashboard
              </span>
              <Link
                href="/"
                className="shrink-0 text-xs font-medium text-nasa-blue hover:underline"
              >
                Open Today
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </PageTransition>
  );
}
