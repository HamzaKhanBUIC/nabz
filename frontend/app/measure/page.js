"use client";

/**
 * ROUTE `/measure` — SCREEN 05 · Take a measurement.
 *
 * The four measurement items sit above the fold exactly as designed; recorded
 * history and the interactive body map follow underneath so the existing
 * functionality stays reachable without disturbing the specified screen.
 */

import { useMemo, useState } from "react";
import PageTransition from "@/components/ui/PageTransition";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge, { DemoBadge } from "@/components/ui/StatusBadge";
import MeasurementItem from "@/components/measure/MeasurementItem";
import { MEASUREMENTS } from "@/components/measure/MeasurementFlow";
import AstronautBodyMap from "@/components/measure/AstronautBodyMap";
import { useStore } from "@/lib/data/store";
import { formatDateTime, relativeTime } from "@/lib/utils/format";
import Icon from "@/components/ui/Icon";

function lastTakenLabel(timestamp) {
  if (!timestamp) return "Not taken yet";
  const then = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate()
  );
  const days = Math.round((startOfToday - startOfThat) / 86_400_000);
  if (days === 0) return "Last taken today";
  if (days === 1) return "Last taken yesterday";
  if (days > 1 && days < 30) return `Last taken ${days} days ago`;
  return `Last taken ${relativeTime(timestamp)}`;
}

function MeasurementHistory() {
  const store = useStore();

  const history = useMemo(
    () =>
      [...store.measurements].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    [store.measurements]
  );

  return (
    <Card>
      <CardHeader
        title="Measurement history"
        subtitle={`Newest first · ${history.length} recorded`}
      />
      <CardBody>
        {history.length === 0 ? (
          <EmptyState
            compact
            icon={null}
            title="No measurements yet"
            description="Completed measurements appear here with the time they were taken."
            actionLabel="Take a measurement"
            actionHref="/measure"
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {history.slice(0, 10).map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-raised text-accent">
                    <Icon name="monitor_heart" size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {entry.systolic}
                      <span className="text-muted"> / </span>
                      {entry.diastolic}
                      <span className="ml-1 text-xs font-normal text-muted">
                        mmHg
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {formatDateTime(entry.timestamp)}
                      {entry.pulse ? ` · ${entry.pulse} bpm` : ""}
                      {entry.posture ? ` · ${entry.posture}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {entry.source === "demo" ? <DemoBadge /> : null}
                  <StatusBadge tone="neutral" dot={false}>
                    {relativeTime(entry.timestamp)}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export default function MeasurePage() {
  const store = useStore();
  const [selectedRegion, setSelectedRegion] = useState(null);

  const lastBloodPressure = useMemo(() => {
    const bp = store.measurements
      .filter((entry) => entry.systolic != null)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return bp[0] || null;
  }, [store.measurements]);

  return (
    <PageTransition>
      <h1 className="t-h1 text-primary">Take a measurement</h1>
      <p className="mt-2 t-body-md text-muted">
        Choose what to measure. Each one guides you step by step.
      </p>

      <div className="mt-9 flex flex-col gap-3">
        {MEASUREMENTS.map((measurement) => (
          <MeasurementItem
            key={measurement.id}
            href={`/measure/blood-pressure?metric=${measurement.id}`}
            title={measurement.title}
            subtitle={
              measurement.id === "blood-pressure"
                ? `${lastTakenLabel(lastBloodPressure?.timestamp)} · ${measurement.subtitle}`
                : measurement.subtitle
            }
            icon={measurement.icon}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-8">
        <MeasurementHistory />

        <Card>
          <CardHeader
            title="Body map"
            subtitle="Interactive SVG — select a region"
          />
          <CardBody>
            <AstronautBodyMap
              selected={selectedRegion}
              onSelect={setSelectedRegion}
            />
          </CardBody>
        </Card>
      </div>
    </PageTransition>
  );
}
