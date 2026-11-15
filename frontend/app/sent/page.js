"use client";

/**
 * ROUTE `/sent` — Sent confirmation (secondary screen).
 *
 * Shows the report that was just queued on `/send-to-earth`: a status pill,
 * a three-stage delivery progress list with timestamps, the ETA derived from
 * the configured one-way Earth delay, and the way back into the app.
 *
 * Frontend only — nothing is transmitted. The in-transit → delivered flip is
 * derived from the stored timestamps against a client clock, so both states
 * are reachable without a backend.
 */

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/lib/data/store";
import { useClientTime } from "@/lib/hooks/useClientTime";
import { getEarthDelayLabel } from "@/lib/data/mission";
import { sectionLabels } from "@/lib/data/reportSections";
import { formatDateTime, formatTime } from "@/lib/utils/format";

/** Progress row — icon + label + timestamp, with a connector between rows. */
function Stage({ stage, last }) {
  const done = stage.state === "done";
  const active = stage.state === "active";

  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
            done
              ? "border-transparent bg-normal text-on-status"
              : active
                ? "border-transparent bg-accent text-on-accent"
                : "border-line bg-surface text-muted"
          }`}
        >
          <Icon name={stage.icon} filled={done || active} size={18} />
        </span>
        {!last ? (
          <span
            className={`w-0.5 flex-1 ${done ? "bg-normal" : "bg-line"}`}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className={`min-w-0 flex-1 ${last ? "" : "pb-6"}`}>
        <p
          className={`text-sm font-semibold ${
            done || active ? "text-primary" : "text-muted"
          }`}
        >
          {stage.label}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">{stage.time}</p>
      </div>
    </li>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="truncate text-sm font-medium text-primary">{value}</span>
    </div>
  );
}

export default function SentPage() {
  const router = useRouter();
  const store = useStore();
  // Ticks so the in-transit → delivered flip lands without a reload.
  const now = useClientTime(10_000);

  const report = store.reports[0] || null;

  const queuedAt = report?.queuedAt || report?.timestamp || null;
  const etaAt = report?.etaAt || queuedAt;

  // True only once the client clock actually passes the ETA (never on the
  // first render, when the clock has not landed yet).
  const pastEta = useMemo(() => {
    if (!now || !etaAt) return false;
    return now.getTime() >= new Date(etaAt).getTime();
  }, [now, etaAt]);

  const delivered = Boolean(report?.deliveredAt) || pastEta;

  // Persist the flip once the clock passes the ETA so the state survives a
  // reload. Runs in an effect only — the clock is never read during render.
  useEffect(() => {
    if (!report || report.deliveredAt || !pastEta) return;
    store.updateReport(report.id, { deliveredAt: new Date().toISOString() });
  }, [report, pastEta, store]);

  if (!store.hydrated) {
    return (
      <PageTransition>
        <PageHeader eyebrow="Downlink" title="Report queued for Earth" />
        <div
          className="h-56 animate-pulse rounded-lg border border-line bg-surface"
          aria-hidden="true"
        />
      </PageTransition>
    );
  }

  if (!report || !queuedAt) {
    return (
      <PageTransition>
        <PageHeader
          eyebrow="Downlink"
          title="Nothing sent yet"
          description="Reports you prepare on Send to Earth appear here with their delivery progress."
        />
        <EmptyState
          icon={(props) => <Icon name="send" {...props} />}
          title="No reports in the outbox"
          description="Choose the sections you want to share with the ground team and queue a summary — it is stored on this device only."
          actionLabel="Send to Earth"
          actionHref="/send-to-earth"
          secondaryLabel="Back to Today"
          onSecondary={() => router.push("/")}
        />
      </PageTransition>
    );
  }

  const stages = [
    {
      key: "queued",
      label: "Queued",
      icon: "schedule",
      time: formatTime(queuedAt),
      state: "done",
    },
    {
      key: "transit",
      label: "In transit",
      icon: "satellite_alt",
      time: delivered
        ? `${formatTime(queuedAt)} – ${formatTime(etaAt)}`
        : `since ${formatTime(queuedAt)}`,
      state: delivered ? "done" : "active",
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: "check_circle",
      time: delivered ? formatTime(etaAt) : `expected ${formatTime(etaAt)}`,
      state: delivered ? "done" : "pending",
    },
  ];

  const labels = sectionLabels(report.sections);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Downlink"
        title="Report queued for Earth"
        description={
          delivered
            ? "The ground team has received this summary. It was generated and stored on this device."
            : "Your summary is on its way. The one-way Earth delay means it arrives later than it was sent."
        }
        actions={
          <StatusPill status={delivered ? "normal" : "attention"}>
            {delivered ? "Delivered" : "In transit"}
          </StatusPill>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Delivery progress */}
        <Card>
          <CardHeader
            title="Delivery progress"
            subtitle={`One-way Earth delay ${getEarthDelayLabel()}`}
          />
          <CardBody>
            <ol className="flex flex-col">
              {stages.map((stage, index) => (
                <Stage
                  key={stage.key}
                  stage={stage}
                  last={index === stages.length - 1}
                />
              ))}
            </ol>

            <p className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3.5 py-3 text-xs text-muted">
              <Icon name="schedule" size={16} className="shrink-0 text-accent" />
              <span>
                Estimated arrival{" "}
                <span className="font-medium text-primary">
                  {formatDateTime(etaAt)}
                </span>
              </span>
            </p>

            {!delivered ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    store.updateReport(report.id, {
                      deliveredAt: new Date().toISOString(),
                    })
                  }
                >
                  <Icon name="done_all" size={16} />
                  Mark delivered (simulated)
                </Button>
                <span className="text-xs text-muted">
                  Demo control — nothing is transmitted.
                </span>
              </div>
            ) : null}
          </CardBody>
        </Card>

        {/* Summary + notice */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Report summary" subtitle={report.id} />
            <CardBody>
              <SummaryRow label="Queued" value={formatDateTime(queuedAt)} />
              <SummaryRow
                label="Expected arrival"
                value={formatDateTime(etaAt)}
              />
              <SummaryRow
                label="Delivery"
                value={delivered ? "Delivered" : "In transit"}
              />

              <div className="mt-4">
                <p className="t-caption uppercase tracking-wider text-muted">
                  Included sections
                </p>
                {labels.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <li
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-raised px-2.5 py-1 text-xs font-medium text-secondary"
                      >
                        <Icon name="check" size={14} className="text-normal" />
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">No sections selected.</p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start gap-3 p-6">
              <Icon
                name="verified_user"
                size={20}
                className="mt-0.5 shrink-0 text-accent"
              />
              <div>
                <p className="text-sm font-medium text-primary">
                  Simulated delivery
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Nothing is transmitted from this device. The report is stored
                  in this browser and the progress above is derived from the
                  configured Earth delay.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" href="/">
          <Icon name="home" size={20} />
          Back to Today
        </Button>
        <Button variant="secondary" size="lg" href="/coach">
          <Icon name="chat" size={20} />
          Ask the coach
        </Button>
      </div>
    </PageTransition>
  );
}
