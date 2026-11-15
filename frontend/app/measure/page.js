"use client";

import { useState } from "react";
import Link from "next/link";
import BackLink from "@/components/ui/BackLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import MeasurementItem from "@/components/measure/MeasurementItem";
import { MEASUREMENTS } from "@/components/measure/MeasurementFlow";
import AstronautBodyMap, { BODY_REGIONS } from "@/components/measure/AstronautBodyMap";
import { useStore } from "@/lib/data/store";
import { formatDateTime } from "@/lib/utils/format";
import { pointStatus } from "@/lib/utils/health";

export default function MeasurePage() {
  const { today, trends } = useStore();
  const [selectedRegion, setSelectedRegion] = useState("left-arm");

  const sysPoints = trends?.["bp-systolic"]?.points || [];
  const diaPoints = trends?.["bp-diastolic"]?.points || [];
  const sysBand = trends?.["bp-systolic"]?.band || null;

  const recentBp = sysPoints
    .slice(-5)
    .reverse()
    .map((sysPt) => {
      const matchDia = diaPoints.find(
        (d) =>
          d.missionDay === sysPt.missionDay &&
          d.effectiveDateTime === sysPt.effectiveDateTime,
      );
      return {
        missionDay: sysPt.missionDay,
        effectiveDateTime: sysPt.effectiveDateTime,
        systolic: Math.round(sysPt.value),
        diastolic: matchDia ? Math.round(matchDia.value) : "—",
        status: pointStatus(sysPt, sysBand),
      };
    });

  const activeRegion =
    BODY_REGIONS.find((r) => r.id === selectedRegion) || BODY_REGIONS[0];

  return (
    <div className="space-y-6">
      <BackLink href="/">Today</BackLink>

      <div>
        <h1 className="t-h1 mt-1 text-primary">Take a measurement</h1>
        <p className="mt-1 text-sm text-secondary">
          Guided blood pressure check with rest timers and symptom checks.
        </p>
      </div>

      <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <div className="space-y-3">
            {MEASUREMENTS.map((m) => (
              <MeasurementItem
                key={m.id}
                href={m.href}
                title={m.title}
                subtitle={m.subtitle}
                icon={m.icon}
              />
            ))}
          </div>

        <Card>
          <CardHeader
            title="Recent blood pressure history"
            subtitle={
              today?.bp
                ? `Latest today: ${today.bp.average.systolic}/${today.bp.average.diastolic} mmHg (${today.bp.category})`
                : "Last 5 systolic / diastolic sessions"
            }
            action={
              <Link
                href="/measure/blood-pressure"
                className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
              >
                New BP check
              </Link>
            }
          />

          <CardBody>
            <ul className="space-y-2.5">
              {recentBp.length === 0 ? (
                <li className="rounded-md border border-line bg-raised p-4 text-sm text-muted">
                  No blood pressure readings logged yet.
                </li>
              ) : (
                recentBp.map((entry) => (
                  <li
                    key={`${entry.missionDay}-${entry.effectiveDateTime}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-raised px-4 py-3"
                  >
                    <div>
                      <p className="tabular-nums text-sm font-semibold text-primary">
                        {entry.systolic}/{entry.diastolic} mmHg
                      </p>
                      <p className="text-xs text-muted">
                        Day {entry.missionDay} · {formatDateTime(entry.effectiveDateTime)}
                      </p>
                    </div>
                    <StatusBadge tone={entry.status.badgeTone} dot={false}>
                      <Icon name={entry.status.iconName} size={14} />
                      <span>{entry.status.label}</span>
                    </StatusBadge>
                  </li>
                ))
              )}
            </ul>
          </CardBody>
        </Card>
        </div>

        <Card>
          <CardHeader
            title="Anatomical cuff & check-up guide"
            subtitle={activeRegion ? `${activeRegion.label}: ${activeRegion.description}` : "Select a region"}
          />
          <CardBody>
            <AstronautBodyMap
              selected={selectedRegion}
              onSelect={setSelectedRegion}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
